import { FeatureFlags } from "../../../../shared/featureFlags";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);

export class ConfirmToBeneficiaryThatApplicationCorrectlySubmitted extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly featureFlags: FeatureFlags,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute({
    id,
    email,
    firstName,
    lastName,
  }: ImmersionApplicationDto): Promise<void> {
    if (this.featureFlags.enableEnterpriseSignature) {
      logger.info(`Skipping sending non-signature beneficiary confirmation`);
      return;
    }
    logger.info(
      { immersionApplicationId: id },
      `------------- Entering execute`,
    );

    await this.emailFilter.withAllowedRecipients(
      [email],
      ([email]) =>
        this.emailGateway.sendNewApplicationBeneficiaryConfirmation(email, {
          demandeId: id,
          firstName,
          lastName,
        }),
      logger,
    );
  }
}
