import {
  ImmersionObjective,
  appellationCodeSchema,
  conventionObjectiveOptions,
  emailSchema,
  localization,
  siretSchema,
  zEnumValidation,
  zStringPossiblyEmpty,
  zTrimmedString,
  zUuidLike,
} from "shared";
import { z } from "zod";
import { ContactEstablishmentPublicV2Dto } from "./ContactEstablishmentPublicV2.dto";

const commonFields = {
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: zTrimmedString,
  potentialBeneficiaryLastName: zTrimmedString,
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

const contactEstablishmentByMailSchema = z.object({
  ...commonFields,
  contactMode: preferEmailContactSchema,
  message: zTrimmedString,
  potentialBeneficiaryPhone: zTrimmedString,
  immersionObjective: immersionObjectiveSchema.nullable(),
  potentialBeneficiaryResumeLink: zStringPossiblyEmpty,
});

const contactEstablishmentByPhoneSchema = z.object({
  ...commonFields,
  contactMode: preferPhoneContactSchema,
});

const contactEstablishmentInPersonSchema = z.object({
  ...commonFields,
  contactMode: preferInPersonContactSchema,
});

export const contactEstablishmentPublicV2Schema: z.Schema<ContactEstablishmentPublicV2Dto> =
  z.union([
    contactEstablishmentByMailSchema,
    contactEstablishmentByPhoneSchema,
    contactEstablishmentInPersonSchema,
  ]);
