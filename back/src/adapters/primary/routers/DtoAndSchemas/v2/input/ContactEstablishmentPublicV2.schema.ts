import {
  ImmersionObjective,
  appellationCodeSchema,
  conventionObjectiveOptions,
  emailSchema,
  localization,
  phoneSchema,
  siretSchema,
  zEnumValidation,
  zStringMinLength1,
  zStringPossiblyEmpty,
  zUuidLike,
} from "shared";
import { z } from "zod";
import {
  ContactEstablishmentByMailPublicV2Dto,
  ContactEstablishmentPublicV2Dto,
} from "./ContactEstablishmentPublicV2.dto";

const commonFields = {
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: zStringMinLength1,
  potentialBeneficiaryLastName: zStringMinLength1,
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

const contactEstablishmentByMailSchema: z.Schema<ContactEstablishmentByMailPublicV2Dto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    message: zStringMinLength1,
    potentialBeneficiaryPhone: phoneSchema,
    immersionObjective: immersionObjectiveSchema.nullable(),
    potentialBeneficiaryResumeLink: zStringPossiblyEmpty.optional(),
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
