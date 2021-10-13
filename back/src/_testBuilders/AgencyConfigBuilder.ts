import { AgencyConfig } from "../domain/immersionApplication/ports/AgencyRepository";
import { Builder } from "./Builder";

const emptyConfig: AgencyConfig = {
  adminEmails: [],
  counsellorEmails: [],
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

  public withAdminEmails(adminEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.config,
      adminEmails,
    });
  }
  public withCounsellorEmails(counsellorEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.config,
      counsellorEmails,
    });
  }
  public allowUnrestrictedEmailSending(
    allowUnrestrictedEmailSending: boolean = true,
  ) {
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
