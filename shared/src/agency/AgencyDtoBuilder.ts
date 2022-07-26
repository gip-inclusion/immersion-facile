import { AbsoluteUrl } from "../AbsoluteUrl";
import { AddressDto } from "../address/address.dto";
import { Builder } from "../Builder";
import { AgencyDto, AgencyId, AgencyKind, AgencyStatus } from "./agency.dto";

const emptyAddress: AddressDto = {
  streetNumberAndAddress: "",
  departmentCode: "",
  city: "",
  postcode: "",
};

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
  address: emptyAddress,
  position: {
    lat: 0,
    lon: 0,
  },
};

export class AgencyDtoBuilder implements Builder<AgencyDto> {
  // Initializes all feature flags to be off.
  public constructor(readonly agency: AgencyDto = emptyAgency) {}

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

  public withAddress(address: AddressDto) {
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
