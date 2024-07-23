import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  FeatureFlag,
  FeatureFlagBoolean,
  FeatureFlagText,
  FeatureFlagTextImageAndRedirect,
  FeatureFlags,
  SetFeatureFlagParam,
  featureFlagNames,
} from "./featureFlags.dto";

export const featureFlagTextValueSchema: z.Schema<FeatureFlagText["value"]> =
  z.object({
    message: z.string(),
  });

const featureFlagBooleanSchema: z.Schema<FeatureFlagBoolean> = z.object({
  isActive: z.boolean(),
  kind: z.literal("boolean"),
});

const featureFlagTextSchema: z.Schema<FeatureFlagText> = z.object({
  isActive: z.boolean(),
  kind: z.literal("text"),
  value: featureFlagTextValueSchema,
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

const featureFlagTextImageAndRedirectSchema: z.Schema<FeatureFlagTextImageAndRedirect> =
  z.object({
    isActive: z.boolean(),
    kind: z.literal("textImageAndRedirect"),
    value: featureFlagTextImageAndRedirectValueSchema,
  });

export const featureFlagSchema: z.Schema<FeatureFlag> =
  featureFlagTextImageAndRedirectSchema
    .or(featureFlagTextSchema)
    .or(featureFlagBooleanSchema);

export const setFeatureFlagSchema: z.Schema<SetFeatureFlagParam> = z.object({
  flagName: z.enum(featureFlagNames),
  featureFlag: featureFlagSchema,
});

export const featureFlagsSchema: z.Schema<FeatureFlags> = z.object({
  enableTemporaryOperation: featureFlagTextImageAndRedirectSchema,
  enableMaintenance: featureFlagTextSchema,
  enableSearchByScore: featureFlagBooleanSchema,
});
