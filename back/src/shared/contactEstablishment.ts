import { z } from "zod";
import {
  preferEmailContactSchema,
  preferInPersonContactSchema,
  preferPhoneContactSchema,
} from "./FormEstablishmentDto";
import { immersionOfferIdSchema } from "./SearchImmersionDto";
import { zEmail, zTrimmedString } from "./zodUtils";

const commonFields = {
  immersionOfferId: immersionOfferIdSchema,
  potentialBeneficiaryFirstName: zTrimmedString,
  potentialBeneficiaryLastName: zTrimmedString,
  potentialBeneficiaryEmail: zEmail,
};

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
