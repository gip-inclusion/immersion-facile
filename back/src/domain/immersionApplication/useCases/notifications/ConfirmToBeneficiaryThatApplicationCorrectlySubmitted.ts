import { FeatureFlags } from "../../../../shared/featureFlags";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "./../../../../utils/logger";
import { EmailFilter } from "./../../../core/ports/EmailFilter";

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
    logger.info({ demandeImmersionid: id }, `------------- Entering execute`);

    const [allowedBeneficiaryEmail] = this.emailFilter.filter([email], {
      onRejected: (email) =>
        logger.info(
          { id, email },
          "Sending beneficiary confirmation email skipped.",
        ),
    });

    if (allowedBeneficiaryEmail) {
      await this.emailGateway.sendNewApplicationBeneficiaryConfirmation(
        allowedBeneficiaryEmail,
        {
          demandeId: id,
          firstName,
          lastName,
        },
      );
    }
  }
}
