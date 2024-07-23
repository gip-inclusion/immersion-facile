import { AbsoluteUrl } from "../AbsoluteUrl";

export type FeatureFlagName = (typeof featureFlagNames)[number];
export const featureFlagNames = [
  "enableTemporaryOperation",
  "enableMaintenance",
  "enableSearchByScore",
] as const;

type FeatureFlagKind = (typeof featureFlagKinds)[number];
const featureFlagKinds = ["boolean", "text", "textImageAndRedirect"] as const;

type GenericFeatureFlag<K extends FeatureFlagKind, V = void> = {
  kind: K;
  isActive: boolean;
} & (V extends void ? object : { value: V });

type WithFeatureFlagTextValue = { message: string };
type WithImageUrl = { imageUrl: AbsoluteUrl };
type WithImageAlt = { imageAlt: string };
type WithRedirectUrl = { redirectUrl: AbsoluteUrl };
type WithTitle = { title: string };
type WithOvertitle = { overtitle: string };

export type FeatureFlagText = GenericFeatureFlag<
  "text",
  WithFeatureFlagTextValue
>;
export type FeatureFlagTextImageAndRedirect = GenericFeatureFlag<
  "textImageAndRedirect",
  WithFeatureFlagTextValue &
    WithImageUrl &
    WithRedirectUrl &
    WithImageAlt &
    WithTitle &
    WithOvertitle
>;
export type FeatureFlagBoolean = GenericFeatureFlag<"boolean">;

export type FeatureFlag =
  | FeatureFlagBoolean
  | FeatureFlagText
  | FeatureFlagTextImageAndRedirect;

export type FeatureFlags = {
  enableMaintenance: FeatureFlagText;
  enableTemporaryOperation: FeatureFlagTextImageAndRedirect;
  enableSearchByScore: FeatureFlagBoolean;
};

export type SetFeatureFlagParam = {
  flagName: FeatureFlagName;
  featureFlag: FeatureFlag;
};

const makeFeatureFlag =
  <K extends FeatureFlagKind>(kind: K) =>
  (
    isActive: boolean,
    ...value: K extends "text"
      ? [FeatureFlagText["value"]]
      : K extends "textImageAndRedirect"
        ? [FeatureFlagTextImageAndRedirect["value"]]
        : []
  ): Extract<FeatureFlag, { kind: K }> => {
    if (kind === "boolean")
      return { kind, isActive } as Extract<FeatureFlag, { kind: K }>;
    return {
      kind,
      isActive,
      value: value[0],
    } as Extract<FeatureFlag, { kind: K }>;
  };

export const makeBooleanFeatureFlag = makeFeatureFlag("boolean");
export const makeTextFeatureFlag = makeFeatureFlag("text");
export const makeTextImageAndRedirectFeatureFlag = makeFeatureFlag(
  "textImageAndRedirect",
);

export const hasFeatureFlagValue = (
  flag: FeatureFlag | SetFeatureFlagParam["featureFlag"],
): flag is Extract<FeatureFlag, { value: object }> =>
  "value" in flag && flag.value !== undefined;
