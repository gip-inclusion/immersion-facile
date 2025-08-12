import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import {
  conventionObjectiveOptions,
  discoverObjective,
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
  type ContactEstablishmentByMail1Eleve1StageDto,
  type ContactEstablishmentByMailDto,
  type ContactEstablishmentByMailIFDto,
  type ContactEstablishmentByPhoneDto,
  type ContactEstablishmentEventPayload,
  type ContactEstablishmentInPersonDto,
  type ContactEstablishmentRequestDto,
  type ContactLevelOfEducation,
  contactLevelsOfEducation,
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
      potentialBeneficiaryPhone: phoneNumberSchema,
      datePreferences: zStringMinLength1,
      contactMode: preferEmailContactSchema,
    }),
  );

const contactEstablishmentByMailIFSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentByMailIFDto> =
  contactEstablishmentByMailCommonSchema.and(
    z.object({
      kind: z.literal("IF"),
      immersionObjective: immersionObjectiveSchema,
      hasWorkingExperience: z.boolean(),
      experienceAdditionalInformation: zStringMinLength1.optional(),
      potentialBeneficiaryResumeLink: zStringCanBeEmpty.optional(),
    }),
  );

const contactLevelOfEducationSchema: ZodSchemaWithInputMatchingOutput<ContactLevelOfEducation> =
  z.enum(contactLevelsOfEducation, {
    error: localization.invalidEnum,
  });

const contactEstablishmentByMail1Eleve1StageSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentByMail1Eleve1StageDto> =
  contactEstablishmentByMailCommonSchema.and(
    z.object({
      kind: z.literal("1_ELEVE_1_STAGE"),
      immersionObjective: z.literal(discoverObjective),
      levelOfEducation: contactLevelOfEducationSchema,
    }),
  );

export const contactEstablishmentByMailSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentByMailDto> =
  contactEstablishmentByMailIFSchema.or(
    contactEstablishmentByMail1Eleve1StageSchema,
  );

export const contactEstablishmentByPhoneSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentByPhoneDto> =
  contactInformationsCommonSchema
    .and(
      z.object({
        contactMode: preferPhoneContactSchema,
      }),
    )
    .and(
      z.discriminatedUnion("kind", [
        z.object({
          kind: z.literal("IF"),
        }),
        z.object({
          kind: z.literal("1_ELEVE_1_STAGE"),
          levelOfEducation: contactLevelOfEducationSchema,
        }),
      ]),
    );

export const contactEstablishmentInPersonSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentInPersonDto> =
  contactInformationsCommonSchema
    .and(
      z.object({
        contactMode: preferInPersonContactSchema,
      }),
    )
    .and(
      z.discriminatedUnion("kind", [
        z.object({
          kind: z.literal("IF"),
        }),
        z.object({
          kind: z.literal("1_ELEVE_1_STAGE"),
          levelOfEducation: z.enum(["3ème", "2nde"], {
            error: localization.invalidEnum,
          }),
        }),
      ]),
    );

export const contactEstablishmentRequestSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentRequestDto> =
  z
    .union([
      contactEstablishmentByMailSchema,
      contactEstablishmentByPhoneSchema,
      contactEstablishmentInPersonSchema,
    ])
    .and(withAcquisitionSchema);

export const contactEstablishmentEventPayloadSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentEventPayload> =
  z.object({ discussionId: z.string(), siret: siretSchema });
