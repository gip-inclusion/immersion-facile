import { FormEstablishmentDto, OmitFromExistingKeys, SiretDto } from "shared";

export const defaultInitialValue = (
  siret?: SiretDto,
): OmitFromExistingKeys<FormEstablishmentDto, "source"> => ({
  siret: siret || "",
  businessName: "",
  businessAddress: "",
  appellations: [],
  businessContact: {
    firstName: "",
    lastName: "",
    job: "",
    phone: "",
    email: "",
    contactMethod: "EMAIL",
    copyEmails: [],
    maxContactPerWeek: 5,
  },
  isSearchable: true,
  website: "",
  additionalInformation: "",
});
