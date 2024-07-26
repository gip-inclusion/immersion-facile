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
  ContactEstablishmentByMailDto,
  ContactEstablishmentByPhoneDto,
  ContactEstablishmentEventPayload,
  ContactEstablishmentInPersonDto,
  ContactEstablishmentRequestDto,
} from "./contactEstablishmentRequest.dto";

const commonFields = {
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: zTrimmedString,
  potentialBeneficiaryLastName: zTrimmedString,
  potentialBeneficiaryEmail: emailSchema,
  locationId: zUuidLike,
};

export const preferEmailContactSchema = z.literal("EMAIL");
export const preferPhoneContactSchema = z.literal("PHONE");
export const preferInPersonContactSchema = z.literal("IN_PERSON");

const immersionObjectiveSchema = zEnumValidation<ImmersionObjective>(
  [...conventionObjectiveOptions],
  localization.invalidImmersionObjective,
);

export const contactEstablishmentByMailFormSchema: z.Schema<ContactEstablishmentByMailDto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    potentialBeneficiaryPhone: phoneSchema,
    immersionObjective: immersionObjectiveSchema,
    potentialBeneficiaryResumeLink: zStringPossiblyEmpty,
    datePreferences: zTrimmedString,
    hasWorkingExperience: z.boolean(),
    experienceAdditionalInformation: zTrimmedString.optional(),
  });

export const contactEstablishmentByMailSchema: z.Schema<ContactEstablishmentByMailDto> =
  z.object({
    ...commonFields,
    contactMode: preferEmailContactSchema,
    potentialBeneficiaryPhone: phoneSchema,
    immersionObjective: immersionObjectiveSchema.nullable(),
    potentialBeneficiaryResumeLink: zStringPossiblyEmpty,
    datePreferences: zTrimmedString,
    hasWorkingExperience: z.boolean(),
    experienceAdditionalInformation: zTrimmedString.optional(),
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
  z
    .union([
      contactEstablishmentByMailSchema,
      contactEstablishmentByPhoneSchema,
      contactEstablishmentInPersonSchema,
    ])
    .and(withAcquisitionSchema);

export const contactEstablishmentEventPayloadSchema: z.Schema<ContactEstablishmentEventPayload> =
  z.object({ discussionId: z.string(), siret: siretSchema });
