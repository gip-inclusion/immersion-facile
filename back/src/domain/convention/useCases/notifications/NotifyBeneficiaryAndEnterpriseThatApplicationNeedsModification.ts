import { z } from "zod";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { frontRoutes } from "shared/src/routes";
import { allRoles } from "shared/src/tokens/MagicLinkPayload";
import { zTrimmedString } from "shared/src/zodUtils";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  ConventionModificationRequestNotificationParams,
} from "../../ports/EmailGateway";
import { conventionSchema } from "shared/src/convention/convention.schema";

const logger = createLogger(__filename);

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

export class NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification extends UseCase<ConventionRequiresModificationPayload> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = conventionRequiresModificationSchema;

  public async _execute({
    convention,
    reason,
    roles,
  }: ConventionRequiresModificationPayload): Promise<void> {
    const agency = await this.agencyRepository.getById(convention.agencyId);
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
          "unexpected role for beneficiary/enterprise modificaton request notification: " +
            role,
        );
      }

      await this.emailFilter.withAllowedRecipients(
        [email],
        ([email]) =>
          this.emailGateway.sendConventionModificationRequestNotification(
            [email],
            getModificationRequestApplicationNotificationParams(
              convention,
              agency,
              reason,
              this.generateMagicLinkFn({
                id: convention.id,
                role,
                targetRoute: frontRoutes.conventionRoute,
                email,
              }),
            ),
          ),
        logger,
      );
    }
  }
}

const getModificationRequestApplicationNotificationParams = (
  convention: ConventionDto,
  agency: AgencyDto,
  reason: string,
  magicLink: string,
): ConventionModificationRequestNotificationParams => ({
  beneficiaryFirstName: convention.firstName,
  beneficiaryLastName: convention.lastName,
  businessName: convention.businessName,
  reason,
  signature: agency.signature,
  agency: agency.name,
  immersionAppellation: convention.immersionAppellation,
  magicLink,
});
