import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import {
  ImmersionObjective,
  conventionObjectiveOptions,
} from "../convention/convention.dto";
import { emailSchema } from "../email/email.schema";
import { phoneSchema } from "../phone.schema";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  zEnumValidation,
  zStringMinLength1,
  zStringPossiblyEmpty,
  zUuidLike,
} from "../zodUtils";
import {
  preferEmailContactSchema,
  preferInPersonContactSchema,
  preferPhoneContactSchema,
} from "./contactEstablishmentRequest.schema";
import {
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

export const legacyContactEstablishmentByMailSchema: z.Schema<LegacyContactEstablishmentByMailDto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    message: zStringMinLength1,
    potentialBeneficiaryPhone: phoneSchema,
    immersionObjective: immersionObjectiveSchema.nullable(),
    potentialBeneficiaryResumeLink: zStringPossiblyEmpty.optional(),
  });

export const legacyContactEstablishmentByPhoneSchema: z.Schema<LegacyContactEstablishmentByPhoneDto> =
  z.object({
    ...commonFields,
    contactMode: preferPhoneContactSchema,
  });

export const legacyContactEstablishmentInPersonSchema: z.Schema<LegacyContactEstablishmentInPersonDto> =
  z.object({
    ...commonFields,
    contactMode: preferInPersonContactSchema,
  });

export const legacyContactEstablishmentRequestSchema: z.Schema<LegacyContactEstablishmentRequestDto> =
  z
    .union([
      legacyContactEstablishmentByMailSchema,
      legacyContactEstablishmentByPhoneSchema,
      legacyContactEstablishmentInPersonSchema,
    ])
    .and(withAcquisitionSchema);
