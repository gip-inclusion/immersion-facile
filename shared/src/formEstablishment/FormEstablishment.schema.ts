import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAcquisitionSchema } from "../acquisition.dto";
import { emailSchema } from "../email/email.schema";
import { nafSchema } from "../naf/naf.schema";
import { phoneSchema } from "../phone.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { dateTimeIsoStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import type { NotEmptyArray } from "../utils";
import { frenchEstablishmentKinds } from "../utils/establishment";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  zBoolean,
  zEnumValidation,
  zStringCanBeEmpty,
  zStringMinLength1,
  zUuidLike,
} from "../zodUtils";
import type {
  BusinessContactDto,
  CSVBoolean,
  ContactMethod,
  EstablishmentBatchReport,
  EstablishmentCSVRow,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentSource,
  SiretAdditionFailure,
  WithFormEstablishmentDto,
} from "./FormEstablishment.dto";

export const defaultMaxContactsPerMonth = 12;
export const noContactPerMonth = 0;

const validContactMethods: NotEmptyArray<ContactMethod> = [
  "EMAIL",
  "PHONE",
  "IN_PERSON",
];
export const contactMethodSchema = zEnumValidation(
  validContactMethods,
  "Choisissez parmis les options proposées",
);

export const businessContactSchema: z.Schema<BusinessContactDto> = z.object({
  lastName: zStringMinLength1,
  firstName: zStringMinLength1,
  job: zStringMinLength1,
  phone: phoneSchema,
  email: emailSchema,
  contactMethod: contactMethodSchema,
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
export const formEstablishmentSchema: z.Schema<FormEstablishmentDto> = z
  .object({
    source: formEstablishmentSourceSchema,
    siret: siretSchema,
    businessName: zStringMinLength1,
    businessNameCustomized: zStringMinLength1
      .refine(
        (s) => !frenchEstablishmentKinds.includes(s.toUpperCase()),
        "Le nom sous lequel vous souhaitez apparaitre dans les résultats de recherche ne peut pas être la raison sociale seule",
      )
      .optional(),
    website: absoluteUrlSchema.or(z.literal("")).optional(),
    additionalInformation: zStringCanBeEmpty.optional(),
    businessAddresses: z
      .array(
        z.object({
          id: zUuidLike,
          rawAddress: addressWithPostalCodeSchema,
        }),
      )
      .min(1),
    isEngagedEnterprise: zBoolean.optional(),
    fitForDisabledWorkers: zBoolean,
    naf: nafSchema.optional(),
    appellations: z
      .array(appellationDtoSchema)
      .min(1, localization.atLeastOneJob),
    businessContact: businessContactSchema,
    maxContactsPerMonth: z
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
  })
  .and(withAcquisitionSchema);

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
    businessNameCustomized: zStringCanBeEmpty,
    businessName: zStringMinLength1,
    businessAddress: addressWithPostalCodeSchema,
    naf_code: zStringMinLength1,
    appellations_code: zStringMinLength1,
    isEngagedEnterprise: csvBooleanSchema,
    businessContact_job: zStringMinLength1,
    businessContact_email: zStringMinLength1,
    businessContact_phone: phoneSchema,
    businessContact_lastName: zStringMinLength1,
    businessContact_firstName: zStringMinLength1,
    businessContact_contactMethod: contactMethodSchema,
    businessContact_copyEmails: zStringCanBeEmpty,
    isSearchable: csvBooleanSchema,
    website: zStringCanBeEmpty,
    additionalInformation: zStringCanBeEmpty,
    fitForDisabledWorkers: csvBooleanSchema,
    searchableByJobSeekers: csvBooleanSchema,
    searchableByStudents: csvBooleanSchema,
  });

export const establishmentCSVRowsSchema: z.Schema<EstablishmentCSVRow[]> =
  z.array(establishmentCSVRowSchema);
