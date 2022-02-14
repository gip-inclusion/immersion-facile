import { AgencyConfig } from "../domain/immersionApplication/ports/AgencyRepository";
import { AgencyId } from "../shared/agencies";
import { Builder } from "./Builder";

const emptyConfig: AgencyConfig = {
  id: "empty-id",
  name: "empty-name",
  counsellorEmails: [],
  validatorEmails: [],
  adminEmails: [],
  questionnaireUrl: "empty-questionnaire-url",
  signature: "empty-signature",
  address: "empty-address",
  position: {
    lat: 0,
    lon: 0,
  },
};

export class AgencyConfigBuilder implements Builder<AgencyConfig> {
  // Initializes all feature flags to be off.
  public constructor(readonly config: AgencyConfig) {}

  public static create(id: AgencyId) {
    return new AgencyConfigBuilder({
      ...emptyConfig,
      id,
    });
  }

  public static empty() {
    return new AgencyConfigBuilder({ ...emptyConfig });
  }

  public withId(id: AgencyId) {
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

  public withAddress(address: string) {
    return new AgencyConfigBuilder({
      ...this.config,
      address,
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

  public withPosition(lat: number, lon: number) {
    return new AgencyConfigBuilder({
      ...this.config,
      position: {
        lat,
        lon,
      },
    });
  }

  public build() {
    return this.config;
  }
}
