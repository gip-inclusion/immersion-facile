import { AgencyDto, AgencyStatus, AgencyId, AgencyKind } from "./agency.dto";
import { AbsoluteUrl } from "../AbsoluteUrl";
import { Builder } from "../Builder";

const emptyAgency: AgencyDto = {
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

export class AgencyDtoBuilder implements Builder<AgencyDto> {
  // Initializes all feature flags to be off.
  public constructor(readonly agency: AgencyDto) {}

  public static create(id?: AgencyId) {
    return new AgencyDtoBuilder({
      ...emptyAgency,
      ...(id ? { id } : {}),
    });
  }

  public static empty() {
    return new AgencyDtoBuilder({ ...emptyAgency });
  }

  public withId(id: AgencyId) {
    return new AgencyDtoBuilder({
      ...this.agency,
      id,
    });
  }

  public withName(name: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      name,
    });
  }

  public withKind(kind: AgencyKind) {
    return new AgencyDtoBuilder({
      ...this.agency,
      kind,
    });
  }

  public withStatus(status: AgencyStatus) {
    return new AgencyDtoBuilder({
      ...this.agency,
      status,
    });
  }

  public withAddress(address: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      address,
    });
  }

  public withCounsellorEmails(counsellorEmails: string[]) {
    return new AgencyDtoBuilder({
      ...this.agency,
      counsellorEmails,
    });
  }

  public withValidatorEmails(validatorEmails: string[]) {
    return new AgencyDtoBuilder({
      ...this.agency,
      validatorEmails,
    });
  }

  public withAdminEmails(adminEmails: string[]) {
    return new AgencyDtoBuilder({
      ...this.agency,
      adminEmails,
    });
  }

  public withQuestionnaireUrl(questionnaireUrl: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      questionnaireUrl,
    });
  }

  public withLogoUrl(logoUrl?: AbsoluteUrl) {
    return new AgencyDtoBuilder({
      ...this.agency,
      logoUrl,
    });
  }

  public withSignature(signature: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      signature,
    });
  }

  public withPosition(lat: number, lon: number) {
    return new AgencyDtoBuilder({
      ...this.agency,
      position: {
        lat,
        lon,
      },
    });
  }

  public withAgencySiret(siret: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      agencySiret: siret,
    });
  }

  public withCodeSafir(code: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      codeSafir: code,
    });
  }

  public build() {
    return this.agency;
  }
}
