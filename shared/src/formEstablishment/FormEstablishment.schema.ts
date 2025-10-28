import { uniq } from "ramda";
import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAcquisitionSchema } from "../acquisition.dto";
import { addressAndPositionSchema } from "../address/address.schema";
import { businessNameSchema } from "../business/business";
import { emailSchema } from "../email/email.schema";
import { nafSchema } from "../naf/naf.schema";
import { phoneNumberSchema } from "../phone/phone.schema";
import { establishmentRoleSchema } from "../role/role.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import type { NotEmptyArray } from "../utils";
import { dateTimeIsoStringSchema } from "../utils/date";
import { frenchEstablishmentKinds } from "../utils/establishment";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zBoolean,
  zEnumValidation,
  zStringCanBeEmpty,
  zStringMinLength1,
  zUuidLike,
} from "../zodUtils";
import type {
  ContactMode,
  CSVBoolean,
  EstablishmentBatchReport,
  EstablishmentCSVRow,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentSource,
  FormEstablishmentUserRight,
  SiretAdditionFailure,
  WithFormEstablishmentDto,
} from "./FormEstablishment.dto";
import { fitForDisabledWorkersOptions } from "./FormEstablishment.dto";

export const defaultMaxContactsPerMonth = 6;
export const noContactPerMonth = 0;

const contactModesWithoutWelcomeAddress: NotEmptyArray<ContactMode> = [
  "EMAIL",
  "PHONE",
];

const contactModesWithWelcomeAddress: NotEmptyArray<ContactMode> = [
  "IN_PERSON",
];

const validContactModes: NotEmptyArray<ContactMode> = [
  ...contactModesWithoutWelcomeAddress,
  ...contactModesWithWelcomeAddress,
];
export const contactModeSchema = zEnumValidation(
  validContactModes,
  "Choisissez parmi les options proposées",
);

const establishmentContactBaseSchema = z.object({
  role: z.literal("establishment-contact"),
  email: emailSchema,
  shouldReceiveDiscussionNotifications: zBoolean,
  job: zStringMinLength1.optional(),
  isMainContactInPerson: zBoolean.optional(),
});

const establishmentContactPhoneSchema = z.object({
  phone: phoneNumberSchema.optional(),
  isMainContactByPhone: zBoolean.optional(),
});

const establishmentContactSchema = establishmentContactBaseSchema.and(
  establishmentContactPhoneSchema,
);

const establishmentAdminSchema = z.object({
  role: z.literal("establishment-admin"),
  email: emailSchema,
  phone: phoneNumberSchema,
  isMainContactByPhone: zBoolean,
  isMainContactInPerson: zBoolean.optional(),
  shouldReceiveDiscussionNotifications: zBoolean,
  job: zStringMinLength1,
});

export const formEstablishmentUserRightSchema: ZodSchemaWithInputMatchingOutput<FormEstablishmentUserRight> =
  establishmentAdminSchema.or(establishmentContactSchema);

export const formEstablishmentUserRightsSchema: ZodSchemaWithInputMatchingOutput<
  FormEstablishmentUserRight[]
> = z
  .array(formEstablishmentUserRightSchema)
  .refine(
    (userRights) =>
      userRights.filter((right) => right.role === "establishment-admin")
        .length > 0,
    "La structure accueillante nécessite au moins un administrateur pour être valide.",
  )
  .refine(
    (userRights) =>
      uniq(userRights.map((right) => right.email)).length === userRights.length,
    "La structure accueillante ne peut pas avoir plusieurs droits pour la même personne.",
  )
  .refine(
    (userRights) =>
      userRights.some((right) => right.shouldReceiveDiscussionNotifications),
    "La structure accueillante nécessite au moins qu'une personne reçoive les notifications liées aux candidatures.",
  );

const formEstablishmentSources: NotEmptyArray<FormEstablishmentSource> = [
  "immersion-facile",
  "cci",
  "cma",
  "lesentreprises-sengagent",
  "unJeuneUneSolution",
  "passeEmploi",
];
export const formEstablishmentSourceSchema = z.enum(formEstablishmentSources, {
  error: localization.invalidEnum,
});

export const fitForDisabledWorkersSchema = z.enum(fitForDisabledWorkersOptions);

const formEstablishmentCommonShape = {
  source: formEstablishmentSourceSchema,
  siret: siretSchema,
  businessName: businessNameSchema,
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
  fitForDisabledWorkers: fitForDisabledWorkersSchema,
  naf: nafSchema.optional(),
  appellations: z
    .array(appellationDtoSchema)
    .min(1, localization.atLeastOneJob),
  userRights: formEstablishmentUserRightsSchema,
  maxContactsPerMonth: z
    .number({
      error:
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
};

export const formEstablishmentSchema: ZodSchemaWithInputMatchingOutput<FormEstablishmentDto> =
  z
    .discriminatedUnion("contactMode", [
      z.object({
        contactMode: z.enum(contactModesWithoutWelcomeAddress, {
          error: localization.invalidEnum,
        }),
        ...formEstablishmentCommonShape,
      }),
      z.object({
        contactMode: z.enum(contactModesWithWelcomeAddress, {
          error: localization.invalidEnum,
        }),
        potentialBeneficiaryWelcomeAddress: addressAndPositionSchema,
        ...formEstablishmentCommonShape,
      }),
    ])
    .and(withAcquisitionSchema)
    .refine(
      (formEstablishment) =>
        formEstablishment.contactMode === "PHONE"
          ? formEstablishment.userRights
              .map((right) => right.isMainContactByPhone)
              .filter((isMainContactByPhone) => isMainContactByPhone === true)
              .length === 1
          : true,
      {
        message:
          "En cas de mode de contact par téléphone, vous devez renseigner un contact principal par téléphone.",
        path: ["userRights"],
      },
    )
    .refine(
      (formEstablishment) =>
        formEstablishment.contactMode === "IN_PERSON"
          ? formEstablishment.userRights
              .map((right) => right.isMainContactInPerson)
              .filter((isMainContactInPerson) => isMainContactInPerson === true)
              .length === 1
          : true,
      {
        message:
          "En cas de mode de contact en personne, vous devez renseigner un contact principal.",
        path: ["userRights"],
      },
    );

export const withFormEstablishmentSchema: ZodSchemaWithInputMatchingOutput<WithFormEstablishmentDto> =
  z.object({
    formEstablishment: formEstablishmentSchema,
  });

export const formEstablishmentBatchSchema: ZodSchemaWithInputMatchingOutput<FormEstablishmentBatchDto> =
  z.object({
    groupName: zStringMinLength1,
    title: zStringMinLength1,
    description: zStringMinLength1,
    formEstablishments: z.array(formEstablishmentSchema),
  });

const siretAdditionFailure: ZodSchemaWithInputMatchingOutput<SiretAdditionFailure> =
  z.object({
    siret: siretSchema,
    errorMessage: z.string(),
  });
export const establishmentBatchReportSchema: ZodSchemaWithInputMatchingOutput<EstablishmentBatchReport> =
  z.object({
    numberOfEstablishmentsProcessed: z.number(),
    numberOfSuccess: z.number(),
    failures: z.array(siretAdditionFailure),
  });

const csvBooleanSchema: ZodSchemaWithInputMatchingOutput<CSVBoolean> = z.enum(
  ["1", "0", ""],
  {
    error: localization.invalidEnum,
  },
);

export const establishmentCSVRowSchema: ZodSchemaWithInputMatchingOutput<EstablishmentCSVRow> =
  z.object({
    siret: siretSchema,
    businessNameCustomized: zStringCanBeEmpty,
    businessName: zStringMinLength1,
    businessAddress: addressWithPostalCodeSchema,
    naf_code: zStringMinLength1,
    appellations_code: zStringMinLength1,
    isEngagedEnterprise: csvBooleanSchema,
    contactMode: contactModeSchema,
    isSearchable: csvBooleanSchema,
    website: zStringCanBeEmpty,
    additionalInformation: zStringCanBeEmpty,
    fitForDisabledWorkers: csvBooleanSchema,
    searchableByJobSeekers: csvBooleanSchema,
    searchableByStudents: csvBooleanSchema,
    right1_email: emailSchema,
    right1_phone: phoneNumberSchema,
    right1_job: zStringMinLength1,
    right2_role: establishmentRoleSchema.optional(),
    right2_email: emailSchema.optional(),
    right2_phone: phoneNumberSchema.optional(),
    right2_job: zStringMinLength1.optional(),
    right3_role: establishmentRoleSchema.optional(),
    right3_email: emailSchema.optional(),
    right3_phone: phoneNumberSchema.optional(),
    right3_job: zStringMinLength1.optional(),
    right4_role: establishmentRoleSchema.optional(),
    right4_email: emailSchema.optional(),
    right4_phone: phoneNumberSchema.optional(),
    right4_job: zStringMinLength1.optional(),
    right5_role: establishmentRoleSchema.optional(),
    right5_email: emailSchema.optional(),
    right5_phone: phoneNumberSchema.optional(),
    right5_job: zStringMinLength1.optional(),
    right6_role: establishmentRoleSchema.optional(),
    right6_email: emailSchema.optional(),
    right6_phone: phoneNumberSchema.optional(),
    right6_job: zStringMinLength1.optional(),
    right7_role: establishmentRoleSchema.optional(),
    right7_email: emailSchema.optional(),
    right7_phone: phoneNumberSchema.optional(),
    right7_job: zStringMinLength1.optional(),
    right8_role: establishmentRoleSchema.optional(),
    right8_email: emailSchema.optional(),
    right8_phone: phoneNumberSchema.optional(),
    right8_job: zStringMinLength1.optional(),
    right9_role: establishmentRoleSchema.optional(),
    right9_email: emailSchema.optional(),
    right9_phone: phoneNumberSchema.optional(),
    right9_job: zStringMinLength1.optional(),
    right10_role: establishmentRoleSchema.optional(),
    right10_email: emailSchema.optional(),
    right10_phone: phoneNumberSchema.optional(),
    right10_job: zStringMinLength1.optional(),
  });

export const establishmentCSVRowsSchema: ZodSchemaWithInputMatchingOutput<
  EstablishmentCSVRow[]
> = z.array(establishmentCSVRowSchema);
