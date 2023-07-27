import { AbsoluteUrl } from "../AbsoluteUrl";
import { AddressDto } from "../address/address.dto";
import { Builder } from "../Builder";
import { Email } from "../email/email.dto";
import { AgencyDto, AgencyId, AgencyKind, AgencyStatus } from "./agency.dto";

const emptyAddress: AddressDto = {
  streetNumberAndAddress: "26 rue de l'adresse par défaut",
  city: "Ville par défaut",
  departmentCode: "86",
  postcode: "86000",
};

export const defaultValidatorEmail = "validator@mail.com";

const emptyAgency: AgencyDto = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "empty-name",
  status: "active",
  kind: "autre",
  counsellorEmails: [],
  validatorEmails: [defaultValidatorEmail],
  adminEmails: [],
  questionnaireUrl: "empty-questionnaire-url",
  signature: "empty-signature",
  address: emptyAddress,
  position: {
    lat: 48.866667, // Paris lat/lon
    lon: 2.333333,
  },
};

export class AgencyDtoBuilder implements Builder<AgencyDto> {
  // Initializes all feature flags to be off.
  constructor(readonly agency: AgencyDto = emptyAgency) {}

  public static create(id?: AgencyId) {
    return new AgencyDtoBuilder({
      ...emptyAgency,
      ...(id ? { id } : {}),
    });
  }

  public static empty() {
    return new AgencyDtoBuilder({ ...emptyAgency });
  }

  public build() {
    return this.agency;
  }

  public withAddress(address: AddressDto) {
    return new AgencyDtoBuilder({
      ...this.agency,
      address,
    });
  }

  public withAdminEmails(adminEmails: string[]) {
    return new AgencyDtoBuilder({
      ...this.agency,
      adminEmails,
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

  public withCounsellorEmails(counsellorEmails: Email[]) {
    return new AgencyDtoBuilder({
      ...this.agency,
      counsellorEmails,
    });
  }

  public withId(id: AgencyId) {
    return new AgencyDtoBuilder({
      ...this.agency,
      id,
    });
  }

  public withKind(kind: AgencyKind) {
    return new AgencyDtoBuilder({
      ...this.agency,
      kind,
    });
  }

  public withLogoUrl(logoUrl?: AbsoluteUrl) {
    return new AgencyDtoBuilder({
      ...this.agency,
      logoUrl,
    });
  }

  public withName(name: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      name,
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

  public withQuestionnaireUrl(questionnaireUrl: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      questionnaireUrl,
    });
  }

  public withSignature(signature: string) {
    return new AgencyDtoBuilder({
      ...this.agency,
      signature,
    });
  }

  public withStatus(status: AgencyStatus) {
    return new AgencyDtoBuilder({
      ...this.agency,
      status,
    });
  }

  public withValidatorEmails(validatorEmails: Email[]) {
    return new AgencyDtoBuilder({
      ...this.agency,
      validatorEmails,
    });
  }
}
