import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  FeatureFlag,
  FeatureFlagBoolean,
  FeatureFlagTextImageAndRedirect,
  FeatureFlagTextWithSeverity,
  FeatureFlags,
  SetFeatureFlagParam,
  featureFlagNames,
} from "./featureFlags.dto";

const featureFlagBooleanSchema: z.Schema<FeatureFlagBoolean> = z.object({
  isActive: z.boolean(),
  kind: z.literal("boolean"),
});

export const featureFlagTextImageAndRedirectValueSchema: z.Schema<
  FeatureFlagTextImageAndRedirect["value"]
> = z.object({
  message: z.string(),
  imageUrl: absoluteUrlSchema,
  imageAlt: z.string(),
  redirectUrl: absoluteUrlSchema,
  title: z.string(),
  overtitle: z.string(),
});

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
  enableProConnect: featureFlagBooleanSchema,
  enableBroadcastOfConseilDepartementalToFT: featureFlagBooleanSchema,
  enableBroadcastOfCapEmploiToFT: featureFlagBooleanSchema,
  enableBroadcastOfMissionLocaleToFT: featureFlagBooleanSchema,
});
