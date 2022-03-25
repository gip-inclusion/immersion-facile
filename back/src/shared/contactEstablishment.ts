import { z } from "zod";
import { immersionOfferIdSchema } from "./searchImmersion/SearchImmersionResult.schema";

import { zEmail, zTrimmedString } from "./zodUtils";

const commonFields = {
  immersionOfferId: immersionOfferIdSchema,
  potentialBeneficiaryFirstName: zTrimmedString,
  potentialBeneficiaryLastName: zTrimmedString,
  potentialBeneficiaryEmail: zEmail,
};

export const preferEmailContactSchema = z.literal("EMAIL");
export const preferPhoneContactSchema = z.literal("PHONE");
export const preferInPersonContactSchema = z.literal("IN_PERSON");

// prettier-ignore
export type ContactEstablishmentByMailDto = z.infer<typeof contactEstablishmentByMailSchema>;
export const contactEstablishmentByMailSchema = z.object({
  ...commonFields,
  contactMode: preferEmailContactSchema,
  message: zTrimmedString,
});

// prettier-ignore
export type ContactEstablishmentByPhoneDto = z.infer<typeof contactEstablishmentByPhoneSchema>;
export const contactEstablishmentByPhoneSchema = z.object({
  ...commonFields,
  contactMode: preferPhoneContactSchema,
});

// prettier-ignore
export type ContactEstablishmentInPersonDto = z.infer<typeof contactEstablishmentInPersonSchema>;
export const contactEstablishmentInPersonSchema = z.object({
  ...commonFields,
  contactMode: preferInPersonContactSchema,
});

// prettier-ignore
export type ContactEstablishmentRequestDto = z.infer<typeof contactEstablishmentRequestSchema>;
export const contactEstablishmentRequestSchema = z.union([
  contactEstablishmentByMailSchema,
  contactEstablishmentByPhoneSchema,
  contactEstablishmentInPersonSchema,
]);
