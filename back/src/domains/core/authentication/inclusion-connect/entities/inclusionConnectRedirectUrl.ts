import { AbsoluteUrl, WithSourcePage, queryParamsAsString } from "shared";
import { InclusionConnectConfig } from "../use-cases/InitiateInclusionConnect";

export const makeInclusionConnectRedirectUri = (
  config: InclusionConnectConfig,
  params: WithSourcePage,
): AbsoluteUrl =>
  `${config.immersionRedirectUri}?${queryParamsAsString<WithSourcePage>(
    params,
  )}`;
