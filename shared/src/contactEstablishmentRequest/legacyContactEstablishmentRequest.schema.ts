import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import {
  conventionObjectiveOptions,
  type ImmersionObjective,
} from "../convention/convention.dto";
import { emailSchema } from "../email/email.schema";
import { phoneNumberSchema } from "../phone/phone.schema";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { zStringCanBeEmpty, zStringMinLength1 } from "../utils/string.schema";
import { zUuidLike } from "../utils/uuid";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zEnumValidation,
} from "../zodUtils";
import type {
  LegacyContactEstablishmentByMailDto,
  LegacyContactEstablishmentByPhoneDto,
  LegacyContactEstablishmentInPersonDto,
  LegacyContactEstablishmentRequestDto,
} from "./legacyContactEstablishmentRequest.dto";

const commonFields = {
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: zStringMinLength1,
  potentialBeneficiaryLastName: zStringMinLength1,
  potentialBeneficiaryEmail: emailSchema,
  locationId: zUuidLike,
};

const immersionObjectiveSchema = zEnumValidation<ImmersionObjective>(
  [...conventionObjectiveOptions],
  localization.invalidImmersionObjective,
);

export const legacyContactEstablishmentByMailSchema: ZodSchemaWithInputMatchingOutput<LegacyContactEstablishmentByMailDto> =
  z.object({
    ...commonFields,
    contactMode: z.literal("EMAIL"),
    message: zStringMinLength1,
    potentialBeneficiaryPhone: phoneNumberSchema,
    immersionObjective: immersionObjectiveSchema.nullable(),
    potentialBeneficiaryResumeLink: zStringCanBeEmpty.optional(),
  });

export const legacyContactEstablishmentByPhoneSchema: ZodSchemaWithInputMatchingOutput<LegacyContactEstablishmentByPhoneDto> =
  z.object({
    ...commonFields,
    contactMode: z.literal("PHONE"),
  });

export const legacyContactEstablishmentInPersonSchema: ZodSchemaWithInputMatchingOutput<LegacyContactEstablishmentInPersonDto> =
  z.object({
    ...commonFields,
    contactMode: z.literal("IN_PERSON"),
  });

export const legacyContactEstablishmentRequestSchema: ZodSchemaWithInputMatchingOutput<LegacyContactEstablishmentRequestDto> =
  z
    .union([
      legacyContactEstablishmentByMailSchema,
      legacyContactEstablishmentByPhoneSchema,
      legacyContactEstablishmentInPersonSchema,
    ])
    .and(withAcquisitionSchema);
