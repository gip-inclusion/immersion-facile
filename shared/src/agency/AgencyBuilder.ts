import { Agency, AgencyStatus, AgencyId, AgencyKind } from "./agency.dto";
import { AbsoluteUrl } from "../AbsoluteUrl";
import { Builder } from "../Builder";

const emptyAgency: Agency = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "empty-name",
  status: "active",
  kind: "autre",
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

export class AgencyBuilder implements Builder<Agency> {
  // Initializes all feature flags to be off.
  public constructor(readonly agency: Agency) {}

  public static create(id?: AgencyId) {
    return new AgencyBuilder({
      ...emptyAgency,
      ...(id ? { id } : {}),
    });
  }

  public static empty() {
    return new AgencyBuilder({ ...emptyAgency });
  }

  public withId(id: AgencyId) {
    return new AgencyBuilder({
      ...this.agency,
      id,
    });
  }

  public withName(name: string) {
    return new AgencyBuilder({
      ...this.agency,
      name,
    });
  }

  public withKind(kind: AgencyKind) {
    return new AgencyBuilder({
      ...this.agency,
      kind,
    });
  }

  public withStatus(status: AgencyStatus) {
    return new AgencyBuilder({
      ...this.agency,
      status,
    });
  }

  public withAddress(address: string) {
    return new AgencyBuilder({
      ...this.agency,
      address,
    });
  }

  public withCounsellorEmails(counsellorEmails: string[]) {
    return new AgencyBuilder({
      ...this.agency,
      counsellorEmails,
    });
  }

  public withValidatorEmails(validatorEmails: string[]) {
    return new AgencyBuilder({
      ...this.agency,
      validatorEmails,
    });
  }

  public withAdminEmails(adminEmails: string[]) {
    return new AgencyBuilder({
      ...this.agency,
      adminEmails,
    });
  }

  public withQuestionnaireUrl(questionnaireUrl: string) {
    return new AgencyBuilder({
      ...this.agency,
      questionnaireUrl,
    });
  }

  public withLogoUrl(logoUrl?: AbsoluteUrl) {
    return new AgencyBuilder({
      ...this.agency,
      logoUrl,
    });
  }

  public withSignature(signature: string) {
    return new AgencyBuilder({
      ...this.agency,
      signature,
    });
  }

  public withPosition(lat: number, lon: number) {
    return new AgencyBuilder({
      ...this.agency,
      position: {
        lat,
        lon,
      },
    });
  }

  public withAgencySiret(siret: string) {
    return new AgencyBuilder({
      ...this.agency,
      agencySiret: siret,
    });
  }

  public withCode(code: string) {
    return new AgencyBuilder({
      ...this.agency,
      code,
    });
  }

  public build() {
    return this.agency;
  }
}
