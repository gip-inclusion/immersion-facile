import { AgencyConfig } from "../domain/immersionApplication/ports/AgencyRepository";
import { AgencyCode } from "../shared/agencies";
import { Builder } from "./Builder";

const emptyConfig: AgencyConfig = {
  id: "",
  name: "",
  counsellorEmails: [],
  validatorEmails: [],
  adminEmails: [],
  allowUnrestrictedEmailSending: false,
  questionnaireUrl: "",
  signature: "",
};

export class AgencyConfigBuilder implements Builder<AgencyConfig> {
  // Initializes all feature flags to be off.
  public constructor(readonly config: AgencyConfig) {}

  public static empty() {
    return new AgencyConfigBuilder(emptyConfig);
  }

  public withId(id: AgencyCode) {
    return new AgencyConfigBuilder({
      ...this.config,
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
  public allowUnrestrictedEmailSending(allowUnrestrictedEmailSending = true) {
    return new AgencyConfigBuilder({
      ...this.config,
      allowUnrestrictedEmailSending,
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
