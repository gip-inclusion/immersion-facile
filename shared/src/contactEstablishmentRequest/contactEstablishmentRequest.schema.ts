import { z } from "zod";
import { emailSchema } from "../email/email.schema";
import { romeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { zTrimmedString } from "../zodUtils";
import {
  ContactEstablishmentByMailDto,
  ContactEstablishmentByPhoneDto,
  ContactEstablishmentInPersonDto,
  ContactEstablishmentRequestDto,
} from "./contactEstablishmentRequest.dto";

const commonFields = {
  offer: romeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: zTrimmedString,
  potentialBeneficiaryLastName: zTrimmedString,
  potentialBeneficiaryEmail: emailSchema,
};

export const preferEmailContactSchema = z.literal("EMAIL");
export const preferPhoneContactSchema = z.literal("PHONE");
export const preferInPersonContactSchema = z.literal("IN_PERSON");

export const contactEstablishmentByMailSchema: z.Schema<ContactEstablishmentByMailDto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    message: zTrimmedString,
  });

export const contactEstablishmentByPhoneSchema: z.Schema<ContactEstablishmentByPhoneDto> =
  z.object({
    ...commonFields,
    contactMode: preferPhoneContactSchema,
  });

export const contactEstablishmentInPersonSchema: z.Schema<ContactEstablishmentInPersonDto> =
  z.object({
    ...commonFields,
    contactMode: preferInPersonContactSchema,
  });

export const contactEstablishmentRequestSchema: z.Schema<ContactEstablishmentRequestDto> =
  z.union([
    contactEstablishmentByMailSchema,
    contactEstablishmentByPhoneSchema,
    contactEstablishmentInPersonSchema,
  ]);
