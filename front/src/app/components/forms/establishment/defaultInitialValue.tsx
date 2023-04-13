import {
  defaultMaxContactsPerWeek as defaultMaxContactsPerWeek,
  FormEstablishmentDto,
  OmitFromExistingKeys,
  SiretDto,
} from "shared";

import { emptyAppellation } from "./MultipleAppellationInput";

export const defaultInitialValue = (
  siret?: SiretDto,
): OmitFromExistingKeys<FormEstablishmentDto, "source"> => ({
  siret: siret || "",
  businessName: "",
  businessAddress: "",
  appellations: [emptyAppellation],
  businessContact: {
    firstName: "",
    lastName: "",
    job: "",
    phone: "",
    email: "",
    contactMethod: "EMAIL",
    copyEmails: [],
  },
  website: "",
  additionalInformation: "",
  maxContactsPerWeek: defaultMaxContactsPerWeek,
});
