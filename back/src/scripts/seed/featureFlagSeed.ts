import {
  FeatureFlags,
  makeBooleanFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  makeTextWithSeverityFeatureFlag,
} from "shared";
import { UnitOfWork } from "../../domains/core/unit-of-work/ports/UnitOfWork";

export const featureFlagsSeed = async (uow: UnitOfWork) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("featureFlagsSeed start ...");

  const featureFlags: FeatureFlags = {
    enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
      message: "message",
      imageUrl: "https://imageUrl",
      redirectUrl: "https://redirect-url",
      imageAlt: "",
      title: "",
      overtitle: "",
    }),
    enableMaintenance: makeTextWithSeverityFeatureFlag(false, {
      message: "Mon message de maintenance",
      severity: "warning",
    }),
    enableSearchByScore: makeBooleanFeatureFlag(true),
    enableProConnect: makeBooleanFeatureFlag(true),
    enableBroadcastOfConseilDepartementalToFT: makeBooleanFeatureFlag(false),
    enableBroadcastOfCapEmploiToFT: makeBooleanFeatureFlag(false),
    enableBroadcastOfMissionLocaleToFT: makeBooleanFeatureFlag(false),
  };

  await uow.featureFlagRepository.insertAll(featureFlags);

  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("featureFlagsSeed done");
};
