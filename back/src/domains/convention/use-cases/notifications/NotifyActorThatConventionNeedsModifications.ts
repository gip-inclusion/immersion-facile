import {
  AgencyDto,
  ConventionDto,
  CreateConventionMagicLinkPayloadProperties,
  Role,
  TemplatedEmail,
  frontRoutes,
} from "shared";
import { P, match } from "ts-pattern";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { TransactionalUseCase } from "../../../core/UseCase";
import { ConventionRequiresModificationPayload } from "../../../core/events/eventPayload.dto";
import { conventionRequiresModificationPayloadSchema } from "../../../core/events/eventPayload.schema";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { prepareMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
    const agency = await uow.agencyRepository.getById(
      payload.convention.agencyId,
    );
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${payload.convention.agencyId}`,
      );
    }

    const recipientOrError = recipientByModifierRole(payload);
    if (recipientOrError instanceof Error) throw recipientOrError;

    const agencyDto = await agencyWithRightToAgencyDto(uow, agency);
    const requesterNameOrError = requesterNameByRole(
      payload.requesterRole,
      payload.convention,
      agencyDto,
    );
    if (requesterNameOrError instanceof Error) throw requesterNameOrError;

    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: await this.#prepareEmail(
        payload.convention,
        payload.modifierRole,
        recipientOrError,
        uow,
        payload.justification,
        agencyDto,
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
    recipientRole: Role,
    recipient: string,
    uow: UnitOfWork,
    justification: string,
    agency: AgencyDto,
    requesterName: string,
  ): Promise<TemplatedEmail> {
    const conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties =
      {
        id: convention.id,
        role: recipientRole,
        email: recipient,
        now: this.timeGateway.now(),
        // UGLY : need to rework, handling of JWT payloads
        ...(recipientRole === "back-office"
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
        magicLink: await makeShortMagicLink({
          targetRoute:
            convention.internshipKind === "immersion"
              ? frontRoutes.conventionImmersionRoute
              : frontRoutes.conventionMiniStageRoute,
          lifetime: "short",
        }),
        agencyLogoUrl: agency.logoUrl ?? undefined,
        requesterName,
      },
    };
  }
}

const recipientByModifierRole = (
  payload: ConventionRequiresModificationPayload,
): string | Error => {
  const missingActorConventionErrorMessage = `No actor with role ${payload.modifierRole} for convention ${payload.convention.id}`;
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
          signatories: P.select(),
        },
      },
      ({ beneficiaryCurrentEmployer }) =>
        beneficiaryCurrentEmployer
          ? beneficiaryCurrentEmployer.email
          : new Error(missingActorConventionErrorMessage),
    )
    .with(
      {
        modifierRole: "beneficiary-representative",
        convention: {
          signatories: P.select(),
        },
      },
      ({ beneficiaryRepresentative }) =>
        beneficiaryRepresentative
          ? beneficiaryRepresentative.email
          : new Error(missingActorConventionErrorMessage),
    )
    .with(
      { modifierRole: P.union("counsellor", "validator") },
      (payload) => payload.agencyActorEmail,
    )
    .exhaustive();

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
    beneficiary: `${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName} (le bénéficiaire)`,
    "establishment-representative": `${convention.signatories.establishmentRepresentative.firstName} ${convention.signatories.establishmentRepresentative.lastName} (le représentant légal de l'entreprise)`,
    counsellor: agency.name,
    validator: agency.name,
    "back-office": "L'équipe Immersion Facilitée",
    "agency-admin": "Le responsable d'agence",
    "establishment-tutor": new Error(wrongRequesterUser),
    "agency-viewer": new Error(wrongRequesterUser),
    "to-review": new Error(wrongRequesterUser),
  };
  return strategy[requesterRole];
};
