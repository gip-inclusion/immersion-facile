import { z } from "zod";
import {
  contactEstablishmentByPhoneSchema,
  contactEstablishmentInPersonSchema,
  emailSchema,
  preferEmailContactSchema,
  romeSchema,
  siretSchema,
  zTrimmedString,
} from "shared";
import {
  ContactEstablishmentByMailPublicV1Dto,
  ContactEstablishmentPublicV1Dto,
} from "./ContactEstablishmentPublicV1.dto";

const commonFields = {
  offer: romeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: zTrimmedString,
  potentialBeneficiaryLastName: zTrimmedString,
  potentialBeneficiaryEmail: emailSchema,
};

const contactEstablishmentByMailSchemaV1: z.Schema<ContactEstablishmentByMailPublicV1Dto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    message: zTrimmedString,
  });

const contactEstablishmentRequestSchemaV1: z.Schema<ContactEstablishmentPublicV1Dto> =
  z.union([
    contactEstablishmentByMailSchemaV1,
    contactEstablishmentByPhoneSchema,
    contactEstablishmentInPersonSchema,
  ]);

export const contactEstablishmentPublicV1Schema: z.Schema<ContactEstablishmentPublicV1Dto> =
  contactEstablishmentRequestSchemaV1;
