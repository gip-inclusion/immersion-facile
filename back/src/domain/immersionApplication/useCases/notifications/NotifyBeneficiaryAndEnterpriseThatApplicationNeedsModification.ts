import { z } from "zod";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { frontRoutes } from "../../../../shared/routes";
import { allRoles } from "../../../../shared/tokens/MagicLinkPayload";
import { zTrimmedString } from "../../../../shared/zodUtils";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyConfig, AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  ModificationRequestApplicationNotificationParams,
} from "../../ports/EmailGateway";
import { immersionApplicationSchema } from "../../../../shared/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);

// prettier-ignore
export type ImmersionApplicationRequiresModificationPayload = z.infer<typeof immersionApplicationRequiresModificationSchema>
const immersionApplicationRequiresModificationSchema = z.object({
  application: immersionApplicationSchema,
  reason: zTrimmedString,
  roles: z.array(z.enum(allRoles)),
});

// prettier-ignore
export type RenewMagicLinkPayload = z.infer<typeof renewMagicLinkPayloadSchema>
export const renewMagicLinkPayloadSchema = z.object({
  emails: z.array(z.string()),
  magicLink: z.string(),
});

export type RequestSignaturePayload = z.infer<
  typeof requestSignaturePayloadSchema
>;
export const requestSignaturePayloadSchema = z.object({
  application: immersionApplicationSchema,
  magicLink: z.string(),
});

export class NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification extends UseCase<ImmersionApplicationRequiresModificationPayload> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationRequiresModificationSchema;

  public async _execute({
    application,
    reason,
    roles,
  }: ImmersionApplicationRequiresModificationPayload): Promise<void> {
    const agencyConfig = await this.agencyRepository.getById(
      application.agencyId,
    );
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${application.agencyId}`,
      );
    }

    for (const role of roles) {
      let email: string | undefined = undefined;
      if (role === "beneficiary") {
        email = application.email;
      } else if (role === "establishment") {
        email = application.mentorEmail;
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
          this.emailGateway.sendModificationRequestApplicationNotification(
            [email],
            getModificationRequestApplicationNotificationParams(
              application,
              agencyConfig,
              reason,
              this.generateMagicLinkFn(
                application.id,
                role,
                frontRoutes.immersionApplicationsRoute,
                email,
              ),
            ),
          ),
        logger,
      );
    }
  }
}

const getModificationRequestApplicationNotificationParams = (
  dto: ImmersionApplicationDto,
  agencyConfig: AgencyConfig,
  reason: string,
  magicLink: string,
): ModificationRequestApplicationNotificationParams => ({
  beneficiaryFirstName: dto.firstName,
  beneficiaryLastName: dto.lastName,
  businessName: dto.businessName,
  reason,
  signature: agencyConfig.signature,
  agency: agencyConfig.name,
  immersionProfession: dto.immersionProfession,
  magicLink,
});
