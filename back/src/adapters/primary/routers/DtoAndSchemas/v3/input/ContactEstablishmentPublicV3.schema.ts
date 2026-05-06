import type { ZodSchemaWithInputMatchingOutput } from "shared";
import {
  appellationCodeSchema,
  contactModeSchema,
  emailSchema,
  firstnameMandatorySchema,
  immersionObjectiveSchema,
  lastnameMandatorySchema,
  localization,
  phoneNumberSchema,
  siretSchema,
  withAcquisitionSchema,
  zStringMinLength1Max1024,
  zStringMinLength1Max6000,
  zUuidLike,
} from "shared";
import { z } from "zod";
import type { ContactEstablishmentPublicV3Dto } from "./ContactEstablishmentPublicV3.dto";

const contactInformationsCommonSchema = z.object({
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: firstnameMandatorySchema,
  potentialBeneficiaryLastName: lastnameMandatorySchema,
  potentialBeneficiaryEmail: emailSchema,
  locationId: zUuidLike,
});

const contactEstablishmentPublicV3CommonSchema =
  contactInformationsCommonSchema.and(
    z.object({
      potentialBeneficiaryPhone: phoneNumberSchema,
      datePreferences: zStringMinLength1Max6000,
      contactMode: contactModeSchema,
    }),
  );

const contactEstablishmentPublicV3IFSchema =
  contactEstablishmentPublicV3CommonSchema.and(
    z.object({
      kind: z.literal("IF"),
      immersionObjective: immersionObjectiveSchema,
      experienceAdditionalInformation: zStringMinLength1Max1024.optional(),
      potentialBeneficiaryResumeLink: zStringMinLength1Max1024.optional(),
    }),
  );

const contactEstablishmentPublicV31Eleve1StageSchema =
  contactEstablishmentPublicV3CommonSchema.and(
    z.object({
      kind: z.literal("1_ELEVE_1_STAGE"),
      immersionObjective: z.literal(
        "Découvrir un métier ou un secteur d'activité",
      ),
      levelOfEducation: z.enum(["3ème", "2nde"], {
        error: localization.invalidEnum,
      }),
    }),
  );

export const contactEstablishmentPublicV3Schema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentPublicV3Dto> =
  contactEstablishmentPublicV3IFSchema
    .or(contactEstablishmentPublicV31Eleve1StageSchema)
    .and(withAcquisitionSchema);
