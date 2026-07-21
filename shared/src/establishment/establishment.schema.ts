import z from "zod";
import { addressAndPositionSchema } from "../address/address.schema";
import { emailSchema } from "../email/email.schema";
import { formEstablishmentPendingUserRightSchema } from "../formEstablishment/FormEstablishment.schema";
import { phoneNumberSchema } from "../phone/phone.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  firstnameMandatorySchema,
  lastnameMandatorySchema,
} from "../user/user.schema";
import { zStringMinLength1Max1024 } from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import { withBannedEstablishmentInformationSchema } from "./bannedEstablishmentInformations.schema";
import {
  businessCustomizedNameSchema,
  businessNameSchema,
} from "./businessComponents.schema";
import type {
  DiscussionEstablishmentContactInfo,
  EstablishmentMainContact,
  EstablishmentNameAndAdmins,
  EstablishmentPublicOption,
  GetEstablishmentPublicOptionsByFiltersInput,
  RegisterUserOnEstablishmentPayload,
} from "./establishment.dto";

export {
  businessAddressSchema,
  businessCustomizedNameSchema,
  businessNameSchema,
} from "./businessComponents.schema";

export const establishmentNameAndAdminsSchema: ZodSchemaWithInputMatchingOutput<EstablishmentNameAndAdmins> =
  z.object({
    name: zStringMinLength1Max1024,
    adminEmails: z.array(emailSchema),
  });

const establishmentMainContactSchema: ZodSchemaWithInputMatchingOutput<EstablishmentMainContact> =
  z.object({
    firstName: firstnameMandatorySchema,
    lastName: lastnameMandatorySchema,
    phone: phoneNumberSchema,
  });

export const discussionEstablishmentContactInfoSchema: ZodSchemaWithInputMatchingOutput<DiscussionEstablishmentContactInfo> =
  z.object({
    siret: siretSchema,
    potentialBeneficiaryWelcomeAddress: addressAndPositionSchema.optional(),
    mainContact: establishmentMainContactSchema,
  });

export const getEstablishmentPublicOptionsByFiltersSchema: ZodSchemaWithInputMatchingOutput<GetEstablishmentPublicOptionsByFiltersInput> =
  z.object({
    nameIncludes: z.string().optional(),
    siret: z.string().optional(),
  });

export const establishmentPublicOptionSchema: ZodSchemaWithInputMatchingOutput<EstablishmentPublicOption> =
  z
    .object({
      businessName: businessNameSchema,
      businessNameCustomized: businessCustomizedNameSchema.optional(),
      siret: siretSchema,
    })
    .and(withBannedEstablishmentInformationSchema);

export const establishmentPublicOptionsSchema: ZodSchemaWithInputMatchingOutput<
  EstablishmentPublicOption[]
> = z.array(establishmentPublicOptionSchema);

export const registerUserOnEstablishmentPayloadSchema: ZodSchemaWithInputMatchingOutput<RegisterUserOnEstablishmentPayload> =
  z.object({
    siret: siretSchema,
    userRight: formEstablishmentPendingUserRightSchema,
  });
