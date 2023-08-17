import { match, P } from "ts-pattern";
import {
  AgencyDto,
  ConventionDto,
  CreateConventionMagicLinkPayloadProperties,
  frontRoutes,
  Role,
  TemplatedEmail,
} from "shared";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { ConventionRequiresModificationPayload } from "../../../core/eventBus/eventPayload.dto";
import { conventionRequiresModificationPayloadSchema } from "../../../core/eventBus/eventPayload.schema";
import { ShortLinkIdGeneratorGateway } from "../../../core/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { prepareMagicShortLinkMaker } from "../../../core/ShortLink";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";

export class NotifyActorThatConventionNeedsModifications extends TransactionalUseCase<ConventionRequiresModificationPayload> {
  protected inputSchema = conventionRequiresModificationPayloadSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    private readonly generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    private readonly timeGateway: TimeGateway,
    private readonly shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    private readonly config: AppConfig,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    payload: ConventionRequiresModificationPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agency] = await uow.agencyRepository.getByIds([
      payload.convention.agencyId,
    ]);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${payload.convention.agencyId}`,
      );
    }

    const recipientOrError = recipientByModifierRole(payload, agency);
    if (recipientOrError instanceof Error) throw recipientOrError;

    const requesterNameOrError = requesterNameByRole(
      payload.requesterRole,
      payload.convention,
      agency,
    );
    if (requesterNameOrError instanceof Error) throw requesterNameOrError;

    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: await this.#prepareEmail(
        payload.convention,
        payload.requesterRole,
        recipientOrError,
        uow,
        payload.justification,
        agency,
        requesterNameOrError,
      ),
      followedIds: {
        conventionId: payload.convention.id,
        agencyId: payload.convention.agencyId,
        establishmentSiret: payload.convention.siret,
      },
    });
  }

  async #prepareEmail(
    convention: ConventionDto,
    role: Role,
    recipient: string,
    uow: UnitOfWork,
    justification: string,
    agency: AgencyDto,
    requesterName: string,
  ): Promise<TemplatedEmail> {
    const conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties =
      {
        id: convention.id,
        role,
        email: recipient,
        now: this.timeGateway.now(),
        // UGLY : need to rework, handling of JWT payloads
        ...(role === "backOffice"
          ? { sub: this.config.backofficeUsername }
          : {}),
      };

    const makeShortMagicLink = prepareMagicShortLinkMaker({
      config: this.config,
      conventionMagicLinkPayload,
      generateConventionMagicLinkUrl: this.generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.shortLinkIdGeneratorGateway,
      uow,
    });

    return {
      kind: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
      recipients: [recipient],
      params: {
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        businessName: convention.businessName,
        justification,
        signature: agency.signature,
        magicLink: await makeShortMagicLink(
          frontRoutes.conventionImmersionRoute,
        ),
        conventionStatusLink: await makeShortMagicLink(
          frontRoutes.conventionStatusDashboard,
        ),
        agencyLogoUrl: agency.logoUrl,
        requesterName,
      },
    };
  }
}

const recipientByModifierRole = (
  payload: ConventionRequiresModificationPayload,
  agency: AgencyDto,
): string | Error => {
  const missingActorConventionErrorMessage = `No actor with role ${payload.modifierRole} for convention ${payload.convention.id}`;
  const missingActorAgencyErrorMessage = `No actor with role ${payload.modifierRole} for agency ${agency.id}`;

  const strategy = match(payload)
    .with(
      { modifierRole: "beneficiary" },
      () => payload.convention.signatories.beneficiary.email,
    )
    .with(
      { modifierRole: "establishment-representative" },
      () => payload.convention.signatories.establishmentRepresentative.email,
    )
    .with(
      {
        modifierRole: "beneficiary-current-employer",
        convention: {
          signatories: {
            beneficiaryCurrentEmployer: P.select(
              P.when(
                (beneficiaryCurrentEmployer) =>
                  beneficiaryCurrentEmployer !== undefined,
              ),
            ),
          },
        },
      },
      (beneficiaryCurrentEmployer) => beneficiaryCurrentEmployer.email,
    )
    .with(
      {
        modifierRole: "beneficiary-representative",
        convention: {
          signatories: {
            beneficiaryRepresentative: P.select(
              P.when(
                (beneficiaryRepresentative) =>
                  beneficiaryRepresentative !== undefined,
              ),
            ),
          },
        },
      },
      (beneficiaryRepresentative) => beneficiaryRepresentative.email,
    )
    .with(
      {
        modifierRole: "counsellor",
        agencyActorEmail: P.select(
          P.when((agencyActorEmail) => agencyActorEmail !== undefined),
        ),
      },
      (agencyActorEmail) => agencyActorEmail,
    )
    .with(
      {
        modifierRole: "validator",
        agencyActorEmail: P.select(
          P.when((agencyActorEmail) => agencyActorEmail !== undefined),
        ),
      },
      (agencyActorEmail) => agencyActorEmail,
    )
    .with(
      { modifierRole: P.union("counsellor", "validator") },
      () => new Error(missingActorAgencyErrorMessage),
    )
    .otherwise(() => new Error(missingActorConventionErrorMessage));

  return strategy;
};

const requesterNameByRole = (
  requesterRole: Role,
  convention: ConventionDto,
  agency: AgencyDto,
): string | Error => {
  const wrongRequesterUser = `Actor with role ${requesterRole} is not allowed to request a modification`;
  const strategy: Record<Role, string | Error> = {
    "beneficiary-current-employer": `${convention.signatories.beneficiaryCurrentEmployer?.firstName} ${convention.signatories.beneficiaryCurrentEmployer?.lastName} (l'employeur actuel du bénéficiaire)`,
    "beneficiary-representative": `${convention.signatories.beneficiaryRepresentative?.firstName} ${convention.signatories.beneficiaryRepresentative?.lastName} (le représentant légal du bénéficiaire)`,
    "legal-representative": `${convention.signatories.beneficiaryRepresentative?.firstName} ${convention.signatories.beneficiaryRepresentative?.lastName} (le représentant légal du bénéficiaire)`,
    beneficiary: `${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName} (le bénéficiaire)`,
    "establishment-representative": `${convention.signatories.establishmentRepresentative.firstName} ${convention.signatories.establishmentRepresentative.lastName} (le représentant légal de l'entreprise)`,
    establishment: `${convention.signatories.establishmentRepresentative.firstName} ${convention.signatories.establishmentRepresentative.lastName} (le représentant légal de l'entreprise)`,
    counsellor: agency.name,
    validator: agency.name,
    "establishment-tutor": new Error(wrongRequesterUser),
    backOffice: "L'équipe Immerssion Facilité",
  };
  return strategy[requesterRole];
};
