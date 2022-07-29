import { z } from "zod";
import { nafSchema } from "../naf";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret";
import { NotEmptyArray, phoneRegExp } from "../utils";
import {
  zBoolean,
  zEmail,
  zString,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import {
  BusinessContactDto,
  FormEstablishmentSource,
  ImmersionContactInEstablishmentId,
  ContactMethod,
  FormEstablishmentDto,
} from "./FormEstablishment.dto";
import { addressWithPostalCodeSchema } from "../utils/postalCode";

// prettier-ignore
export const immersionContactInEstablishmentIdSchema: z.ZodSchema<ImmersionContactInEstablishmentId> =
  zTrimmedString;

const validContactMethods: NotEmptyArray<ContactMethod> = [
  "EMAIL",
  "PHONE",
  "IN_PERSON",
];
const preferredContactMethodSchema = z.enum(validContactMethods);

export const businessContactSchema: z.Schema<BusinessContactDto> = z.object({
  lastName: zTrimmedString,
  firstName: zTrimmedString,
  job: zTrimmedString,
  phone: zString.regex(phoneRegExp, "Numero de téléphone incorrect"),
  email: zEmail,
  contactMethod: preferredContactMethodSchema,
  copyEmails: z.array(zEmail),
});

const formEstablishmentSources: NotEmptyArray<FormEstablishmentSource> = [
  "immersion-facile",
  "cci",
  "cma",
  "lesentreprises-sengagent",
  "unJeuneUneSolution",
  "testConsumer",
  "passeEmploi",
];
export const formEstablishmentSourceSchema = z.enum(formEstablishmentSources);
export const formEstablishmentSchema: z.Schema<FormEstablishmentDto> = z.object(
  {
    source: formEstablishmentSourceSchema,
    siret: siretSchema,
    businessName: zTrimmedString,
    businessNameCustomized: zTrimmedString.optional(),
    website: zStringPossiblyEmpty.optional(),
    additionalInformation: zStringPossiblyEmpty.optional(),
    businessAddress: addressWithPostalCodeSchema,
    isEngagedEnterprise: zBoolean.optional(),
    naf: nafSchema.optional(),
    appellations: z
      .array(appellationDtoSchema)
      .min(1, "Spécifiez au moins 1 métier"),
    businessContact: businessContactSchema,
    isSearchable: zBoolean,
  },
  { required_error: "Veuillez compléter le formulaire" },
);
