import { z } from "zod";

export type FeatureFlagName = (typeof featureFlagNames)[number];
const featureFlagNames = [
  "enableInseeApi",
  "enablePeConnectApi",
  "enableLogoUpload",
  "enablePeConventionBroadcast",
  "enableTemporaryOperation",
  "enableMaxContactPerWeek",
  "enableMaintenance",
] as const;

type FeatureFlagKind = (typeof featureFlagKinds)[number];
const featureFlagKinds = ["boolean", "text"] as const;

type GenericFeatureFlag<K extends FeatureFlagKind, V = never> = {
  kind: K;
  isActive: boolean;
  value: V;
};

type FeatureFlagTextValue = { message: string };

export type FeatureFlagText = GenericFeatureFlag<"text", FeatureFlagTextValue>;
type FeatureFlagBoolean = GenericFeatureFlag<"boolean">;

export type FeatureFlag = FeatureFlagBoolean | FeatureFlagText;

export type FeatureFlags = Record<FeatureFlagName, FeatureFlag>;

const featureFlagSchema: z.Schema<FeatureFlag> = z
  .object({
    isActive: z.boolean(),
    kind: z.literal("boolean"),
    value: z.never(),
  })
  .or(
    z.object({
      isActive: z.boolean(),
      kind: z.literal("text"),
      value: z.object({
        message: z.string(),
      }),
    }),
  );

export const featureFlagsSchema: z.Schema<FeatureFlags> = z.object({
  enableInseeApi: featureFlagSchema,
  enablePeConnectApi: featureFlagSchema,
  enableLogoUpload: featureFlagSchema,
  enablePeConventionBroadcast: featureFlagSchema,
  enableTemporaryOperation: featureFlagSchema,
  enableMaxContactPerWeek: featureFlagSchema,
  enableMaintenance: featureFlagSchema,
});

export type SetFeatureFlagParam = {
  flagName: FeatureFlagName;
  flagContent: {
    isActive: boolean;
    value?: FeatureFlagText["value"];
  };
};

const setFeatureFlagValueSchema: z.Schema<SetFeatureFlagParam["flagContent"]> =
  z.object({
    isActive: z.boolean(),
    value: z
      .object({
        message: z.string(),
      })
      .optional(),
  });

export const setFeatureFlagSchema: z.Schema<SetFeatureFlagParam> = z.object({
  flagName: z.enum(featureFlagNames),
  flagContent: setFeatureFlagValueSchema,
});

const makeFeatureFlag =
  <K extends FeatureFlagKind>(kind: K) =>
  (
    isActive: boolean,
    ...value: K extends "text" ? [FeatureFlagText["value"]] : []
  ): Extract<FeatureFlag, { kind: K }> =>
    kind === "boolean"
      ? ({ kind, isActive } as Extract<FeatureFlag, { kind: K }>)
      : ({
          kind,
          isActive,
          value: value[0],
        } as Extract<FeatureFlag, { kind: K }>);

export const makeBooleanFeatureFlag = makeFeatureFlag("boolean");
export const makeTextFeatureFlag = makeFeatureFlag("text");
