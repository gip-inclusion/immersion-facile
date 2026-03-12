import {
  appellationCodeSchema,
  conventionObjectiveOptions,
  emailSchema,
  type ImmersionObjective,
  localization,
  phoneNumberSchema,
  siretSchema,
  type ZodSchemaWithInputMatchingOutput,
  zEnumValidation,
  zStringCanBeEmpty,
  zStringMinLength1Max1024,
  zUuidLike,
} from "shared";
import { z } from "zod";
import type {
  ContactEstablishmentByMailPublicV2Dto,
  ContactEstablishmentPublicV2Dto,
} from "./ContactEstablishmentPublicV2.dto";

const commonFields = {
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: zStringMinLength1Max1024,
  potentialBeneficiaryLastName: zStringMinLength1Max1024,
  potentialBeneficiaryEmail: emailSchema,
  locationId: zUuidLike.optional(),
};

const preferEmailContactSchema = z.literal("EMAIL");
const preferPhoneContactSchema = z.literal("PHONE");
const preferInPersonContactSchema = z.literal("IN_PERSON");

const immersionObjectiveSchema = zEnumValidation<ImmersionObjective>(
  [...conventionObjectiveOptions],
  localization.invalidImmersionObjective,
);

const contactEstablishmentByMailSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentByMailPublicV2Dto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    message: zStringMinLength1Max1024,
    potentialBeneficiaryPhone: phoneNumberSchema,
    immersionObjective: immersionObjectiveSchema.nullable(),
    potentialBeneficiaryResumeLink: zStringCanBeEmpty.optional(),
  });

const contactEstablishmentByPhoneSchema = z.object({
  ...commonFields,
  contactMode: preferPhoneContactSchema,
});

const contactEstablishmentInPersonSchema = z.object({
  ...commonFields,
  contactMode: preferInPersonContactSchema,
});

export const contactEstablishmentPublicV2Schema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentPublicV2Dto> =
  z.union([
    contactEstablishmentByMailSchema,
    contactEstablishmentByPhoneSchema,
    contactEstablishmentInPersonSchema,
  ]);
