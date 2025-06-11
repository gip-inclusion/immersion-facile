import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { zStringMinLength1 } from "../zodUtils";
import {
  type FeatureFlag,
  type FeatureFlagBoolean,
  type FeatureFlagHighlight,
  type FeatureFlagTextImageAndRedirect,
  type FeatureFlagTextWithSeverity,
  type FeatureFlags,
  type SetFeatureFlagParam,
  type WithFeatureFlagButtonValue,
  type WithFeatureFlagTextValue,
  type WithFeatureFlagTitleValue,
  featureFlagNames,
} from "./featureFlags.dto";

const featureFlagBooleanSchema: z.Schema<FeatureFlagBoolean> = z.object({
  isActive: z.boolean(),
  kind: z.literal("boolean"),
});

const featureFlagMessageSchema: z.Schema<WithFeatureFlagTextValue> = z.object({
  message: zStringMinLength1,
});

const featureFlagButtonSchema: z.Schema<WithFeatureFlagButtonValue> = z.object({
  href: absoluteUrlSchema,
  label: zStringMinLength1,
});

const featureFlagTitleSchema: z.Schema<WithFeatureFlagTitleValue> = z.object({
  title: zStringMinLength1,
});

export const featureFlagHighlightValueSchema: z.Schema<
  FeatureFlagHighlight["value"]
> = featureFlagTitleSchema
  .and(featureFlagMessageSchema)
  .and(featureFlagButtonSchema);

export const featureFlagTextImageAndRedirectValueSchema: z.Schema<
  FeatureFlagTextImageAndRedirect["value"]
> = z
  .object({
    imageUrl: absoluteUrlSchema,
    imageAlt: z.string(),
    redirectUrl: absoluteUrlSchema,
    overtitle: zStringMinLength1,
  })
  .and(featureFlagMessageSchema)
  .and(featureFlagTitleSchema);

export const featureFlagTextWithSeverityValueSchema: z.Schema<
  FeatureFlagTextWithSeverity["value"]
> = z.object({
  message: z.string(),
  severity: z.enum(["warning", "error", "success", "info"]),
});

const featureFlagTextWithSeveritySchema: z.Schema<FeatureFlagTextWithSeverity> =
  z.object({
    isActive: z.boolean(),
    kind: z.literal("textWithSeverity"),
    value: featureFlagTextWithSeverityValueSchema,
  });

const featureFlagTextImageAndRedirectSchema: z.Schema<FeatureFlagTextImageAndRedirect> =
  z.object({
    isActive: z.boolean(),
    kind: z.literal("textImageAndRedirect"),
    value: featureFlagTextImageAndRedirectValueSchema,
  });

const featureFlagHighlightSchema: z.Schema<FeatureFlagHighlight> = z.object({
  isActive: z.boolean(),
  kind: z.literal("highlight"),
  value: featureFlagHighlightValueSchema,
});

export const featureFlagSchema: z.Schema<FeatureFlag> =
  featureFlagTextImageAndRedirectSchema
    .or(featureFlagTextWithSeveritySchema)
    .or(featureFlagBooleanSchema);

export const setFeatureFlagSchema: z.Schema<SetFeatureFlagParam> = z.object({
  flagName: z.enum(featureFlagNames),
  featureFlag: featureFlagSchema,
});

export const featureFlagsSchema: z.Schema<FeatureFlags> = z.object({
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
