import { FormEstablishmentDto } from "shared";
import { SiretDto } from "shared";
import { OmitFromExistingKeys } from "shared";

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
  },
  isSearchable: true,
  website: "",
  additionalInformation: "",
});
