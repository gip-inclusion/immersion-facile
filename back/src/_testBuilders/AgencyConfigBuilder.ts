import { AgencyConfig } from "../domain/immersionApplication/ports/AgencyRepository";
import { AgencyCode } from "../shared/agencies";
import { Builder } from "./Builder";

const emptyConfig: AgencyConfig = {
  id: "empty-id",
  uuid: "empty-uuid",
  name: "empty-name",
  counsellorEmails: [],
  validatorEmails: [],
  adminEmails: [],
  questionnaireUrl: "empty-questionnaire-url",
  signature: "empty-signature",
};

export class AgencyConfigBuilder implements Builder<AgencyConfig> {
  // Initializes all feature flags to be off.
  public constructor(readonly config: AgencyConfig) {}

  public static create(id: AgencyCode) {
    return new AgencyConfigBuilder({
      ...emptyConfig,
      id,
    });
  }

  public withName(name: string) {
    return new AgencyConfigBuilder({
      ...this.config,
      name,
    });
  }

  public withCounsellorEmails(counsellorEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.config,
      counsellorEmails,
    });
  }
  public withValidatorEmails(validatorEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.config,
      validatorEmails,
    });
  }
  public withAdminEmails(adminEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.config,
      adminEmails,
    });
  }
  public withQuestionnaireUrl(questionnaireUrl: string) {
    return new AgencyConfigBuilder({
      ...this.config,
      questionnaireUrl,
    });
  }
  public withSignature(signature: string) {
    return new AgencyConfigBuilder({
      ...this.config,
      signature,
    });
  }

  public build() {
    return this.config;
  }
}
