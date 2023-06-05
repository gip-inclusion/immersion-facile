import { z } from "zod";
import {
  AgencyDto,
  allRoles,
  BackOfficeJwtPayload,
  ConventionDto,
  conventionSchema,
  CreateConventionMagicLinkPayloadProperties,
  frontRoutes,
  Role,
  zTrimmedString,
} from "shared";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { ShortLinkIdGeneratorGateway } from "../../../core/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { prepareMagicShortLinkMaker } from "../../../core/ShortLink";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";

// prettier-ignore
export type ConventionRequiresModificationPayload = z.infer<typeof conventionRequiresModificationSchema>
const conventionRequiresModificationSchema = z.object({
  convention: conventionSchema,
  justification: zTrimmedString,
  roles: z.array(z.enum(allRoles)),
});

export class NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification extends TransactionalUseCase<ConventionRequiresModificationPayload> {
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

  inputSchema = conventionRequiresModificationSchema;

  public async _execute(
    { convention, justification, roles }: ConventionRequiresModificationPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }

    for (const role of roles) {
      const email = emailByRoleForConventionNeedsModification(
        role,
        convention,
        agency,
      );
      if (email instanceof Error) throw email;
      if(role === "backOffice") {
        const conventionMagicLinkPayload:  BackOfficeJwtPayload=
        {
          iat: ,
          role,
          sub: "admin",
          version:1,
        }; 
      }
      const conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties =
        {
          id: convention.id,
          role,
          email,
          now: this.timeGateway.now(),
        };

      const makeShortMagicLink = prepareMagicShortLinkMaker({
        config: this.config,
        conventionMagicLinkPayload,
        generateConventionMagicLinkUrl: this.generateConventionMagicLinkUrl,
        shortLinkIdGeneratorGateway: this.shortLinkIdGeneratorGateway,
        uow,
      });

      await this.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          type: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
          recipients: [email],
          params: {
            internshipKind: convention.internshipKind,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            justification,
            signature: agency.signature,
            immersionAppellation: convention.immersionAppellation,
            magicLink: await makeShortMagicLink(
              frontRoutes.conventionImmersionRoute,
            ),
            conventionStatusLink: await makeShortMagicLink(
              frontRoutes.conventionStatusDashboard,
            ),
            agencyLogoUrl: agency.logoUrl,
          },
        },
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
    }
  }
}

const emailByRoleForConventionNeedsModification = (
  role: Role,
  convention: ConventionDto,
  agency: AgencyDto,
): string | Error => {
  const error = new Error(
    `Unsupported role for beneficiary/enterprise modification request notification: ${role}`,
  );
  const missingEmailError = new Error(
    `No actor with role ${role} for convention ${convention.id}`,
  );
  const strategy: Record<Role, string | Error> = {
    backOffice: "admin@immersion-facile.beta.gouv.fr",
    "beneficiary-current-employer":
      convention.signatories.beneficiaryCurrentEmployer?.email ??
      missingEmailError,
    "beneficiary-representative":
      convention.signatories.beneficiaryRepresentative?.email ??
      missingEmailError,
    "establishment-tutor": error,
    "legal-representative":
      convention.signatories.beneficiaryRepresentative?.email ??
      missingEmailError,
    counsellor: agency.counsellorEmails[0],
    validator: agency.validatorEmails[0],
    "establishment-representative":
      convention.signatories.establishmentRepresentative.email,
    establishment: convention.signatories.establishmentRepresentative.email,
    beneficiary: convention.signatories.beneficiary.email,
  };
  return strategy[role];
};
