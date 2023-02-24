import { z } from "zod";
import { nafSchema } from "../naf";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { NotEmptyArray, phoneRegExp } from "../utils";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  zBoolean,
  zEmail,
  zString,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import {
  BusinessContactDto,
  ContactMethod,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentSource,
  ImmersionContactInEstablishmentId,
} from "./FormEstablishment.dto";

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
  phone: zString.regex(phoneRegExp, localization.invalidPhone),
  email: zEmail,
  contactMethod: preferredContactMethodSchema,
  copyEmails: z.array(zEmail),
  maxContactPerWeek: z
    .number()
    .positive({ message: "La valeur renseignée ne peut pas être négative" })
    .int({ message: "La valeur renseignée ne peut pas contenir de décimale" })
    .optional(),
});

const formEstablishmentSources: NotEmptyArray<FormEstablishmentSource> = [
  "immersion-facile",
  "cci",
  "cma",
  "lesentreprises-sengagent",
  "unJeuneUneSolution",
  "passeEmploi",
];
export const formEstablishmentSourceSchema = z.enum(formEstablishmentSources);
export const formEstablishmentSchema: z.Schema<FormEstablishmentDto> = z.object(
  {
    source: formEstablishmentSourceSchema,
    siret: siretSchema,
    businessName: zTrimmedString,
    businessNameCustomized: zStringPossiblyEmpty,
    website: zStringPossiblyEmpty,
    additionalInformation: zStringPossiblyEmpty,
    businessAddress: addressWithPostalCodeSchema,
    isEngagedEnterprise: zBoolean.optional(),
    fitForDisabledWorkers: zBoolean.optional(),
    naf: nafSchema.optional(),
    appellations: z
      .array(appellationDtoSchema)
      .min(1, localization.atLeastOneJob),
    businessContact: businessContactSchema,
    isSearchable: zBoolean,
  },
);

export const formEstablishmentBatchSchema: z.Schema<FormEstablishmentBatchDto> =
  z.object({
    groupName: zString,
    formEstablishments: z.array(formEstablishmentSchema),
  });
