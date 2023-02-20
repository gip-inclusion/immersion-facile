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
  EstablishmentGroupName,
  ImmersionContactInEstablishmentId,
} from "./FormEstablishment.dto";

// prettier-ignore
export const immersionContactInEstablishmentIdSchema: z.ZodSchema<ImmersionContactInEstablishmentId> =
  zTrimmedString;

export const defaultMaxContactsPerWeek = 10;
export const noContactPerWeek = 0;

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
    maxContactsPerWeek: z
      .number()
      .nonnegative({
        message: "La valeur renseignée ne peut pas être négative",
      })
      .int({
        message: "La valeur renseignée ne peut pas contenir de décimale",
      }),
  },
);

export const formEstablishmentBatchSchema: z.Schema<FormEstablishmentBatchDto> =
  z.object({
    groupName: zString,
    formEstablishments: z.array(formEstablishmentSchema),
  });

export const establishmentGroupSchema: z.Schema<EstablishmentGroupName> =
  zString;
