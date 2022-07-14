import { conventionSchema } from "shared/src/convention/convention.schema";
import { frontRoutes } from "shared/src/routes";
import { allRoles } from "shared/src/tokens/MagicLinkPayload";
import { zTrimmedString } from "shared/src/zodUtils";
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
  reason: zTrimmedString,
  roles: z.array(z.enum(allRoles)),
});

// prettier-ignore
export type RenewMagicLinkPayload = z.infer<typeof renewMagicLinkPayloadSchema>
export const renewMagicLinkPayloadSchema = z.object({
  emails: z.array(z.string()),
  magicLink: z.string(),
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
    { convention, reason, roles }: ConventionRequiresModificationPayload,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }

    for (const role of roles) {
      let email: string | undefined = undefined;
      if (role === "beneficiary") {
        email = convention.email;
      } else if (role === "establishment") {
        email = convention.mentorEmail;
      }

      if (!email) {
        throw new Error(
          "unexpected role for beneficiary/enterprise modification request notification: " +
            role,
        );
      }

      await this.emailGateway.sendEmail({
        type: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
        recipients: [email],
        params: {
          beneficiaryFirstName: convention.firstName,
          beneficiaryLastName: convention.lastName,
          businessName: convention.businessName,
          reason,
          signature: agency.signature,
          agency: agency.name,
          immersionAppellation: convention.immersionAppellation,
          magicLink: this.generateMagicLinkFn({
            id: convention.id,
            role,
            targetRoute: frontRoutes.conventionRoute,
            email,
          }),
        },
      });
    }
  }
}
