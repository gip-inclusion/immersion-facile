import { z } from "zod";
import {
  allRoles,
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
import { EmailGateway } from "../../ports/EmailGateway";

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
    private readonly emailGateway: EmailGateway,
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
      const email = emailByRoleForConventionNeedsModification(role, convention);
      if (email instanceof Error) throw email;

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

      await this.emailGateway.sendEmail({
        type: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
        recipients: [email],
        params: {
          internshipKind: convention.internshipKind,
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          businessName: convention.businessName,
          justification,
          signature: agency.signature,
          agency: agency.name,
          immersionAppellation: convention.immersionAppellation,
          magicLink: await makeShortMagicLink(
            frontRoutes.conventionImmersionRoute,
          ),
          conventionStatusLink: await makeShortMagicLink(
            frontRoutes.conventionStatusDashboard,
          ),
          agencyLogoUrl: agency.logoUrl,
        },
      });
    }
  }
}

const emailByRoleForConventionNeedsModification = (
  role: Role,
  convention: ConventionDto,
): string | Error => {
  const error = new Error(
    `Unsupported role for beneficiary/enterprise modification request notification: ${role}`,
  );
  const strategy: Record<Role, string | Error> = {
    backOffice: error,
    "beneficiary-current-employer": error,
    "beneficiary-representative": error,
    "establishment-tutor": error,
    "legal-representative": error,
    counsellor: error,
    validator: error,
    "establishment-representative":
      convention.signatories.establishmentRepresentative.email,
    establishment: convention.signatories.establishmentRepresentative.email,
    beneficiary: convention.signatories.beneficiary.email,
  };
  return strategy[role];
};
