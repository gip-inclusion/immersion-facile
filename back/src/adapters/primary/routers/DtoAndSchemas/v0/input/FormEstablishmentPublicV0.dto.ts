import {
  defaultMaxContactsPerWeek,
  Flavor,
  FormEstablishmentDto,
  OmitFromExistingKeys,
} from "shared";

// prettier-ignore
export type ImmersionContactInEstablishmentId = Flavor<string, "ImmersionContactInEstablishmentId">;

export type ProfessionDtoPublicV0 = {
  romeCodeMetier: string; // 5 characters respecting regex : /[A-N]\d{4}/
  romeCodeAppellation?: string; // 5 digits (regex : /\d{5}/  )
  description: string;
};

export type BusinessContactDtoPublicV0 = {
  lastName: string;
  firstName: string;
  job: string;
  phone: string; // we have a very permissive regex /^\+?[0-9]+$/
  email: string; // a valid email
};

export type ContactMethodPublicV0 = "UNKNOWN" | "EMAIL" | "PHONE" | "IN_PERSON";

export type FormEstablishmentDtoPublicV0 = {
  siret: string; // 14 characters string
  businessName: string;
  businessNameCustomized?: string;
  businessAddress: string; // must include post code
  isEngagedEnterprise?: boolean;
  naf?: { code: string; nomenclature: string };
  professions: ProfessionDtoPublicV0[]; // at least one
  businessContacts: BusinessContactDtoPublicV0[]; // array of exactly one element (a bit strange but it from long ago)
  preferredContactMethods: ContactMethodPublicV0[]; // array of exactly one element (a bit strange but it from long ago)
};

export const formEstablishmentDtoPublicV0ToDomain = (
  publicV0: FormEstablishmentDtoPublicV0,
): OmitFromExistingKeys<FormEstablishmentDto, "source"> => {
  const { businessContacts, preferredContactMethods, professions, ...rest } =
    publicV0;

  return {
    ...rest,
    appellations: professions.map((profession) => ({
      appellationCode: profession.romeCodeAppellation ?? "00000",
      appellationLabel: profession.description,
      romeCode: profession.romeCodeMetier,
      romeLabel: profession.description,
    })),
    businessContact: {
      ...businessContacts[0],
      contactMethod:
        preferredContactMethods[0] === "UNKNOWN"
          ? "EMAIL"
          : preferredContactMethods[0],
      copyEmails: [],
    },

    isSearchable: true,
    website: "",
    additionalInformation: "",
    maxContactsPerWeek: defaultMaxContactsPerWeek,
  };
};
