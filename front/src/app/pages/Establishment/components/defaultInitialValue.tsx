import { FormEstablishmentDto } from "src/shared/formEstablishment/FormEstablishment.dto";
import { SiretDto } from "src/shared/siret";
import { OmitFromExistingKeys } from "src/shared/utils";

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
