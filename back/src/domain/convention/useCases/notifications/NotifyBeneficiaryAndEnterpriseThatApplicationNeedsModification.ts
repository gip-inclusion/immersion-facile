import {
  allRoles,
  conventionSchema,
  frontRoutes,
  zTrimmedString,
} from "shared";
import { z } from "zod";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

// prettier-ignore
export type ConventionRequiresModificationPayload = z.infer<typeof conventionRequiresModificationSchema>
const conventionRequiresModificationSchema = z.object({
  convention: conventionSchema,
  justification: zTrimmedString,
  roles: z.array(z.enum(allRoles)),
});

// prettier-ignore
export type RenewMagicLinkPayload = z.infer<typeof renewMagicLinkPayloadSchema>
export const renewMagicLinkPayloadSchema = z.object({
  emails: z.array(z.string()),
  magicLink: z.string(),
  conventionStatusLink: z.string(),
});

export class NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification extends TransactionalUseCase<ConventionRequiresModificationPayload> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionRequiresModificationSchema;

  public async _execute(
    { convention, justification, roles }: ConventionRequiresModificationPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }
    const beneficiary = convention.signatories.beneficiary;
    const establishmentRepresentative =
      convention.signatories.establishmentRepresentative;

    for (const role of roles) {
      let email: string | undefined = undefined;
      if (role === "beneficiary") {
        email = beneficiary.email;
      } else if (role === "establishment") {
        email = establishmentRepresentative.email;
      }

      if (!email)
        throw new Error(
          "unexpected role for beneficiary/enterprise modification request notification: " +
            role,
        );

      const magicLinkCommonFields = {
        id: convention.id,
        role,
        email,
      };

      await this.emailGateway.sendEmail({
        type: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
        recipients: [email],
        params: {
          beneficiaryFirstName: beneficiary.firstName,
          beneficiaryLastName: beneficiary.lastName,
          businessName: convention.businessName,
          justification,
          signature: agency.signature,
          agency: agency.name,
          immersionAppellation: convention.immersionAppellation,
          magicLink: this.generateMagicLinkFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.conventionImmersionRoute,
          }),
          conventionStatusLink: this.generateMagicLinkFn({
            ...magicLinkCommonFields,
            targetRoute: frontRoutes.conventionStatusDashboard,
          }),
        },
      });
    }
  }
}
