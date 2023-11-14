import { AbsoluteUrl, queryParamsAsString, WithSourcePage } from "shared";
import { InclusionConnectConfig } from "../useCases/InitiateInclusionConnect";

export const makeInclusionConnectRedirectUri = (
  config: InclusionConnectConfig,
  params: WithSourcePage,
): AbsoluteUrl =>
  `${config.immersionRedirectUri}?${queryParamsAsString<WithSourcePage>(
    params,
  )}`;
