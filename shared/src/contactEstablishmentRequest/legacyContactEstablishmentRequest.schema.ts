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
  zStringPossiblyEmpty,
  zTrimmedString,
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
  potentialBeneficiaryFirstName: zTrimmedString,
  potentialBeneficiaryLastName: zTrimmedString,
  potentialBeneficiaryEmail: emailSchema,
  locationId: zUuidLike,
};

const immersionObjectiveSchema = zEnumValidation<ImmersionObjective>(
  [...conventionObjectiveOptions],
  localization.invalidImmersionObjective,
);

export const legacyContactEstablishmentByMailFormSchema: z.Schema<LegacyContactEstablishmentByMailDto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    message: zTrimmedString,
    potentialBeneficiaryPhone: phoneSchema,
    immersionObjective: immersionObjectiveSchema,
    potentialBeneficiaryResumeLink: zStringPossiblyEmpty,
  });

export const legacyContactEstablishmentByMailSchema: z.Schema<LegacyContactEstablishmentByMailDto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    message: zTrimmedString,
    potentialBeneficiaryPhone: phoneSchema,
    immersionObjective: immersionObjectiveSchema.nullable(),
    potentialBeneficiaryResumeLink: zStringPossiblyEmpty,
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
