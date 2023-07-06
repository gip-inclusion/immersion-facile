import {
  defaultMaxContactsPerWeek as defaultMaxContactsPerWeek,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import { emptyAppellation } from "./MultipleAppellationInput";

export const defaultInitialValue = (
  siret?: SiretDto,
): FormEstablishmentDto => ({
  source: "immersion-facile",
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
