import { z } from "zod";
import { emailSchema } from "../email/email.schema";
import { nafSchema } from "../naf";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { NotEmptyArray, phoneRegExp } from "../utils";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  zBoolean,
  zString,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import {
  BusinessContactDto,
  ContactMethod,
  CSVBoolean,
  EstablishmentBatchReport,
  EstablishmentCSVRow,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentSource,
  ImmersionContactInEstablishmentId,
  SiretAdditionFailure,
  WithEstablishmentGroupSlug,
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
  email: emailSchema,
  contactMethod: preferredContactMethodSchema,
  copyEmails: z.array(emailSchema),
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

export const withEstablishmentGroupSlugSchema: z.Schema<WithEstablishmentGroupSlug> =
  z.object({ groupSlug: zString });

const siretAdditionFailure: z.Schema<SiretAdditionFailure> = z.object({
  siret: siretSchema,
  errorMessage: z.string(),
});
export const establishmentBatchReportSchema: z.Schema<EstablishmentBatchReport> =
  z.object({
    numberOfEstablishmentsProcessed: z.number(),
    numberOfSuccess: z.number(),
    failures: z.array(siretAdditionFailure),
  });

const csvBooleanSchema: z.Schema<CSVBoolean> = z.enum(["1", "0", ""]);

export const establishmentCSVRowSchema: z.Schema<EstablishmentCSVRow> =
  z.object({
    siret: siretSchema,
    businessNameCustomized: zStringPossiblyEmpty,
    businessName: zTrimmedString,
    businessAddress: addressWithPostalCodeSchema,
    naf_code: zString,
    appellations_code: zString,
    isEngagedEnterprise: csvBooleanSchema,
    businessContact_job: zString,
    businessContact_email: zString,
    businessContact_phone: zString,
    businessContact_lastName: zString,
    businessContact_firstName: zString,
    businessContact_contactMethod: preferredContactMethodSchema,
    businessContact_copyEmails: zStringPossiblyEmpty,
    isSearchable: csvBooleanSchema,
    website: zStringPossiblyEmpty,
    additionalInformation: zStringPossiblyEmpty,
    fitForDisabledWorkers: csvBooleanSchema,
  });

export const establishmentCSVRowsSchema: z.Schema<EstablishmentCSVRow[]> =
  z.array(establishmentCSVRowSchema);
