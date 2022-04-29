import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "shared/src/siret";
import { OmitFromExistingKeys } from "shared/src/utils";

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
});
