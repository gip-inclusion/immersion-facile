import { z } from "zod";
import { emailSchema } from "../email/email.schema";
import { nafSchema } from "../naf";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { dateTimeIsoStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import { NotEmptyArray, phoneRegExp } from "../utils";
import { frenchEstablishmentKinds } from "../utils/establishment";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  zBoolean,
  zEnumValidation,
  zStringMinLength1,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import {
  BusinessContactDto,
  CSVBoolean,
  ContactMethod,
  EstablishmentBatchReport,
  EstablishmentCSVRow,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentSource,
  ImmersionContactInEstablishmentId,
  SiretAdditionFailure,
  WithFormEstablishmentDto,
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
const preferredContactMethodSchema = zEnumValidation(
  validContactMethods,
  "Choisissez parmis les options proposées",
);

export const businessContactSchema: z.Schema<BusinessContactDto> = z.object({
  lastName: zTrimmedString,
  firstName: zTrimmedString,
  job: zTrimmedString,
  phone: zStringMinLength1.regex(phoneRegExp, localization.invalidPhone),
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
    businessNameCustomized: z
      .string()
      .transform((s) => s.trim())
      .refine(
        (s) => !frenchEstablishmentKinds.includes(s.toUpperCase()),
        "Le nom sous lequel vous souhaitez apparaitre dans les résultats de recherche ne peut pas être la raison sociale seule",
      )
      .optional(),
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
      .number({
        invalid_type_error:
          "Veuillez renseigner le nombre maximum de mise en contact par semaine que vous souhaitez recevoir",
      })
      .nonnegative({
        message: "La valeur renseignée ne peut pas être négative",
      })
      .int({
        message: "La valeur renseignée ne peut pas contenir de décimale",
      }),
    nextAvailabilityDate: dateTimeIsoStringSchema.optional(),
    searchableBy: z.object({
      students: zBoolean,
      jobSeekers: zBoolean,
    }),
  },
);

export const withFormEstablishmentSchema: z.Schema<WithFormEstablishmentDto> =
  z.object({
    formEstablishment: formEstablishmentSchema,
  });

export const formEstablishmentBatchSchema: z.Schema<FormEstablishmentBatchDto> =
  z.object({
    groupName: zStringMinLength1,
    title: zStringMinLength1,
    description: zStringMinLength1,
    formEstablishments: z.array(formEstablishmentSchema),
  });

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
    naf_code: zStringMinLength1,
    appellations_code: zStringMinLength1,
    isEngagedEnterprise: csvBooleanSchema,
    businessContact_job: zStringMinLength1,
    businessContact_email: zStringMinLength1,
    businessContact_phone: zStringMinLength1,
    businessContact_lastName: zStringMinLength1,
    businessContact_firstName: zStringMinLength1,
    businessContact_contactMethod: preferredContactMethodSchema,
    businessContact_copyEmails: zStringPossiblyEmpty,
    isSearchable: csvBooleanSchema,
    website: zStringPossiblyEmpty,
    additionalInformation: zStringPossiblyEmpty,
    fitForDisabledWorkers: csvBooleanSchema,
    searchableByJobSeekers: csvBooleanSchema,
    searchableByStudents: csvBooleanSchema,
  });

export const establishmentCSVRowsSchema: z.Schema<EstablishmentCSVRow[]> =
  z.array(establishmentCSVRowSchema);
