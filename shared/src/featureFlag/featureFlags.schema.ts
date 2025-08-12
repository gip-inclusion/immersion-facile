import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
  zStringMinLength1,
} from "../zodUtils";
import {
  type FeatureFlag,
  type FeatureFlagBoolean,
  type FeatureFlagHighlight,
  type FeatureFlags,
  type FeatureFlagTextImageAndRedirect,
  type FeatureFlagTextWithSeverity,
  featureFlagNames,
  type SetFeatureFlagParam,
  type WithFeatureFlagButtonValue,
  type WithFeatureFlagTextValue,
  type WithFeatureFlagTitleValue,
} from "./featureFlags.dto";

const featureFlagBooleanSchema: ZodSchemaWithInputMatchingOutput<FeatureFlagBoolean> =
  z.object({
    isActive: z.boolean(),
    kind: z.literal("boolean"),
  });

const withFeatureFlagTitleSchema: ZodSchemaWithInputMatchingOutput<WithFeatureFlagTitleValue> =
  z.object({
    title: zStringCanBeEmpty,
  });

const withFeatureFlagMessageSchema: ZodSchemaWithInputMatchingOutput<WithFeatureFlagTextValue> =
  z.object({
    message: zStringCanBeEmpty,
  });

const withFeatureFlagButtonSchema: ZodSchemaWithInputMatchingOutput<WithFeatureFlagButtonValue> =
  z.object({
    href: absoluteUrlSchema,
    label: zStringMinLength1,
  });

export const featureFlagHighlightValueSchema: ZodSchemaWithInputMatchingOutput<
  FeatureFlagHighlight["value"]
> = withFeatureFlagTitleSchema
  .and(withFeatureFlagMessageSchema)
  .and(withFeatureFlagButtonSchema);

export const featureFlagTextImageAndRedirectValueSchema: ZodSchemaWithInputMatchingOutput<
  FeatureFlagTextImageAndRedirect["value"]
> = z
  .object({
    imageUrl: absoluteUrlSchema,
    imageAlt: z.string(),
    redirectUrl: absoluteUrlSchema,
    overtitle: zStringCanBeEmpty,
  })
  .and(withFeatureFlagMessageSchema)
  .and(withFeatureFlagTitleSchema);

export const featureFlagTextWithSeverityValueSchema: ZodSchemaWithInputMatchingOutput<
  FeatureFlagTextWithSeverity["value"]
> = z.object({
  message: z.string(),
  severity: z.enum(["warning", "error", "success", "info"], {
    error: localization.invalidEnum,
  }),
});

const featureFlagTextWithSeveritySchema: ZodSchemaWithInputMatchingOutput<FeatureFlagTextWithSeverity> =
  z.object({
    isActive: z.boolean(),
    kind: z.literal("textWithSeverity"),
    value: featureFlagTextWithSeverityValueSchema,
  });

const featureFlagTextImageAndRedirectSchema: ZodSchemaWithInputMatchingOutput<FeatureFlagTextImageAndRedirect> =
  z.object({
    isActive: z.boolean(),
    kind: z.literal("textImageAndRedirect"),
    value: featureFlagTextImageAndRedirectValueSchema,
  });

const featureFlagHighlightSchema: ZodSchemaWithInputMatchingOutput<FeatureFlagHighlight> =
  z.object({
    isActive: z.boolean(),
    kind: z.literal("highlight"),
    value: featureFlagHighlightValueSchema,
  });

export const featureFlagSchema: ZodSchemaWithInputMatchingOutput<FeatureFlag> =
  featureFlagTextImageAndRedirectSchema
    .or(featureFlagTextWithSeveritySchema)
    .or(featureFlagBooleanSchema)
    .or(featureFlagHighlightSchema);

export const setFeatureFlagSchema: ZodSchemaWithInputMatchingOutput<SetFeatureFlagParam> =
  z.object({
    flagName: z.enum(featureFlagNames, {
      error: localization.invalidEnum,
    }),
    featureFlag: featureFlagSchema,
  });

export const featureFlagsSchema: ZodSchemaWithInputMatchingOutput<FeatureFlags> =
  z.object({
    enableTemporaryOperation: featureFlagTextImageAndRedirectSchema,
    enableMaintenance: featureFlagTextWithSeveritySchema,
    enableSearchByScore: featureFlagBooleanSchema,
    enableBroadcastOfConseilDepartementalToFT: featureFlagBooleanSchema,
    enableBroadcastOfCapEmploiToFT: featureFlagBooleanSchema,
    enableBroadcastOfMissionLocaleToFT: featureFlagBooleanSchema,
    enableStandardFormatBroadcastToFranceTravail: featureFlagBooleanSchema,
    enableEstablishmentDashboardHighlight: featureFlagHighlightSchema,
    enableAgencyDashboardHighlight: featureFlagHighlightSchema,
  });
