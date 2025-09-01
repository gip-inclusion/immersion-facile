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
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zEnumValidation,
  zStringCanBeEmpty,
  zStringMinLength1,
  zUuidLike,
} from "../zodUtils";
import {
  preferEmailContactSchema,
  preferInPersonContactSchema,
  preferPhoneContactSchema,
} from "./contactEstablishmentRequest.schema";
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
    contactMode: preferEmailContactSchema,
    message: zStringMinLength1,
    potentialBeneficiaryPhone: phoneNumberSchema,
    immersionObjective: immersionObjectiveSchema.nullable(),
    potentialBeneficiaryResumeLink: zStringCanBeEmpty.optional(),
  });

export const legacyContactEstablishmentByPhoneSchema: ZodSchemaWithInputMatchingOutput<LegacyContactEstablishmentByPhoneDto> =
  z.object({
    ...commonFields,
    contactMode: preferPhoneContactSchema,
  });

export const legacyContactEstablishmentInPersonSchema: ZodSchemaWithInputMatchingOutput<LegacyContactEstablishmentInPersonDto> =
  z.object({
    ...commonFields,
    contactMode: preferInPersonContactSchema,
  });

export const legacyContactEstablishmentRequestSchema: ZodSchemaWithInputMatchingOutput<LegacyContactEstablishmentRequestDto> =
  z
    .union([
      legacyContactEstablishmentByMailSchema,
      legacyContactEstablishmentByPhoneSchema,
      legacyContactEstablishmentInPersonSchema,
    ])
    .and(withAcquisitionSchema);
