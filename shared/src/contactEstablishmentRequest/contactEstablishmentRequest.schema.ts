import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import {
  type ImmersionObjective,
  conventionObjectiveOptions,
  discoverObjective,
} from "../convention/convention.dto";
import { emailSchema } from "../email/email.schema";
import { phoneSchema } from "../phone.schema";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  zEnumValidation,
  zStringCanBeEmpty,
  zStringMinLength1,
  zUuidLike,
} from "../zodUtils";
import type {
  ContactEstablishmentByMail1Eleve1StageDto,
  ContactEstablishmentByMailDto,
  ContactEstablishmentByMailIFDto,
  ContactEstablishmentByPhoneDto,
  ContactEstablishmentEventPayload,
  ContactEstablishmentInPersonDto,
  ContactEstablishmentRequestDto,
} from "./contactEstablishmentRequest.dto";

const contactInformationsCommonSchema = z.object({
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: zStringMinLength1,
  potentialBeneficiaryLastName: zStringMinLength1,
  potentialBeneficiaryEmail: emailSchema,
  locationId: zUuidLike,
});

export const preferEmailContactSchema = z.literal("EMAIL");
export const preferPhoneContactSchema = z.literal("PHONE");
export const preferInPersonContactSchema = z.literal("IN_PERSON");

const immersionObjectiveSchema = zEnumValidation<ImmersionObjective>(
  [...conventionObjectiveOptions],
  localization.invalidImmersionObjective,
);

const contactEstablishmentByMailCommonSchema =
  contactInformationsCommonSchema.and(
    z.object({
      potentialBeneficiaryPhone: phoneSchema,
      potentialBeneficiaryResumeLink: zStringCanBeEmpty.optional(),
      datePreferences: zStringMinLength1,
      contactMode: preferEmailContactSchema,
    }),
  );

const contactEstablishmentByMailIFSchema: z.Schema<ContactEstablishmentByMailIFDto> =
  contactEstablishmentByMailCommonSchema.and(
    z.object({
      discussionKind: z.literal("IF"),
      immersionObjective: immersionObjectiveSchema,
      hasWorkingExperience: z.boolean(),
      experienceAdditionalInformation: zStringMinLength1.optional(),
    }),
  );

const contactEstablishmentByMail1Eleve1StageSchema: z.Schema<ContactEstablishmentByMail1Eleve1StageDto> =
  contactEstablishmentByMailCommonSchema.and(
    z.object({
      discussionKind: z.literal("1_ELEVE_1_STAGE"),
      immersionObjective: z.literal(discoverObjective),
      levelOfEducation: z.enum(["3ème", "2nde"]),
    }),
  );

export const contactEstablishmentByMailSchema: z.Schema<ContactEstablishmentByMailDto> =
  contactEstablishmentByMailIFSchema.or(
    contactEstablishmentByMail1Eleve1StageSchema,
  );

export const contactEstablishmentByPhoneSchema: z.Schema<ContactEstablishmentByPhoneDto> =
  contactInformationsCommonSchema
    .and(
      z.object({
        contactMode: preferPhoneContactSchema,
      }),
    )
    .and(
      z.discriminatedUnion("discussionKind", [
        z.object({
          discussionKind: z.literal("IF"),
        }),
        z.object({
          discussionKind: z.literal("1_ELEVE_1_STAGE"),
          levelOfEducation: z.enum(["3ème", "2nde"]),
        }),
      ]),
    );

export const contactEstablishmentInPersonSchema: z.Schema<ContactEstablishmentInPersonDto> =
  contactInformationsCommonSchema
    .and(
      z.object({
        contactMode: preferInPersonContactSchema,
      }),
    )
    .and(
      z.discriminatedUnion("discussionKind", [
        z.object({
          discussionKind: z.literal("IF"),
        }),
        z.object({
          discussionKind: z.literal("1_ELEVE_1_STAGE"),
          levelOfEducation: z.enum(["3ème", "2nde"]),
        }),
      ]),
    );

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
