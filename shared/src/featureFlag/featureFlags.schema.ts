import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { zStringMinLength1 } from "../zodUtils";
import {
  FeatureFlag,
  featureFlagNames,
  FeatureFlags,
  FeatureFlagText,
  FeatureFlagTextImageAndRedirect,
  SetFeatureFlagParam,
} from "./featureFlags.dto";

export const featureFlagTextValueSchema: z.Schema<FeatureFlagText["value"]> =
  z.object({
    message: z.string(),
  });
// const featureFlagBooleanSchema: z.Schema<FeatureFlagBoolean> = z.object({
//   isActive: z.boolean(),
//   kind: z.literal("boolean"),
//   value: z.void().optional(),
// });
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
  imageAlt: zStringMinLength1,
  redirectUrl: absoluteUrlSchema,
});

// const setFeatureFlagValueSchema: z.Schema<SetFeatureFlagParam["flagContent"]> =
//   z.object({
//     isActive: z.boolean(),
//     value: featureFlagTextValueSchema
//       .or(featureFlagTextImageAndRedirectValueSchema)
//       .optional(),
//   });

const featureFlagTextImageAndRedirectSchema: z.Schema<FeatureFlagTextImageAndRedirect> =
  z.object({
    isActive: z.boolean(),
    kind: z.literal("textImageAndRedirect"),
    value: featureFlagTextImageAndRedirectValueSchema,
  });

export const featureFlagSchema: z.Schema<FeatureFlag> =
  featureFlagTextImageAndRedirectSchema.or(featureFlagTextSchema);

export const setFeatureFlagSchema: z.Schema<SetFeatureFlagParam> = z.object({
  flagName: z.enum(featureFlagNames),
  featureFlag: featureFlagSchema,
});

export const featureFlagsSchema: z.Schema<FeatureFlags> = z.object({
  enableTemporaryOperation: featureFlagTextImageAndRedirectSchema,
  enableMaintenance: featureFlagTextSchema,
});
