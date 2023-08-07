import {
  AgencyDto,
  ConventionDto,
  CreateConventionMagicLinkPayloadProperties,
  frontRoutes,
  ModifierRole,
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

export const backOfficeEmail = "support@immersion-facile.beta.gouv.fr";

export class NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification extends TransactionalUseCase<ConventionRequiresModificationPayload> {
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
    {
      justification,
      role,
      convention,
      modifierRole,
    }: ConventionRequiresModificationPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }

    const recipientsOrError = recipientsByModifierRole(
      modifierRole,
      convention,
      agency,
    );
    if (recipientsOrError instanceof Error) throw recipientsOrError;

    for (const recipient of recipientsOrError) {
      await this.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: await this.#prepareEmail(
          convention,
          role,
          recipient,
          uow,
          justification,
          agency,
        ),
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
    }
  }

  async #prepareEmail(
    convention: ConventionDto,
    role: Role,
    recipient: string,
    uow: UnitOfWork,
    justification: string,
    agency: AgencyDto,
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
      },
    };
  }
}

const recipientsByModifierRole = (
  modifierRole: ModifierRole,
  convention: ConventionDto,
  agency: AgencyDto,
): string[] | Error => {
  const missingActorConventionErrorMessage = `No actor with role ${modifierRole} for convention ${convention.id}`;
  const missingActorAgencyErrorMessage = `No actor with role ${modifierRole} for agency ${agency.id}`;

  const strategy: Record<ModifierRole, string | string[] | Error> = {
    "beneficiary-current-employer":
      convention.signatories.beneficiaryCurrentEmployer?.email ??
      new Error(missingActorConventionErrorMessage),
    "beneficiary-representative":
      convention.signatories.beneficiaryRepresentative?.email ??
      new Error(missingActorConventionErrorMessage),
    "establishment-representative":
      convention.signatories.establishmentRepresentative.email,
    beneficiary: convention.signatories.beneficiary.email,
    counsellor:
      agency.counsellorEmails.length > 0
        ? agency.counsellorEmails
        : new Error(missingActorAgencyErrorMessage),
    validator:
      agency.validatorEmails.length > 0
        ? agency.validatorEmails
        : new Error(missingActorAgencyErrorMessage),
  };
  const result = strategy[modifierRole];
  return Array.isArray(result) || result instanceof Error ? result : [result];
};
