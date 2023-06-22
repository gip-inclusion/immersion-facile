import { z } from "zod";
import {
  emailSchema,
  preferEmailContactSchema,
  preferInPersonContactSchema,
  preferPhoneContactSchema,
  romeDtoSchema,
  siretSchema,
  zTrimmedString,
} from "shared";
import {
  ContactEstablishmentByMailPublicV1Dto,
  ContactEstablishmentByPhonePublicV1Dto,
  ContactEstablishmentInPersonPublicV1Dto,
  ContactEstablishmentPublicV1Dto,
} from "./ContactEstablishmentPublicV1.dto";

const commonFields = {
  offer: romeDtoSchema,
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

const contactEstablishmentByPhoneSchemaV1: z.Schema<ContactEstablishmentByPhonePublicV1Dto> =
  z.object({
    ...commonFields,
    contactMode: preferPhoneContactSchema,
  });
const contactEstablishmentInPersonSchemaV1: z.Schema<ContactEstablishmentInPersonPublicV1Dto> =
  z.object({
    ...commonFields,
    contactMode: preferInPersonContactSchema,
  });

const contactEstablishmentRequestSchemaV1: z.Schema<ContactEstablishmentPublicV1Dto> =
  z.union([
    contactEstablishmentByMailSchemaV1,
    contactEstablishmentByPhoneSchemaV1,
    contactEstablishmentInPersonSchemaV1,
  ]);

export const contactEstablishmentPublicV1Schema: z.Schema<ContactEstablishmentPublicV1Dto> =
  contactEstablishmentRequestSchemaV1;
