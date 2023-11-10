import {
  AbsoluteUrl,
  queryParamsAsString,
  StartInclusionConnectLoginQueryParams,
} from "shared";
import { InclusionConnectConfig } from "../useCases/InitiateInclusionConnect";

export const makeInclusionConnectRedirectUri = (
  config: InclusionConnectConfig,
  params: StartInclusionConnectLoginQueryParams,
): AbsoluteUrl =>
  `${
    config.immersionRedirectUri
  }?${queryParamsAsString<StartInclusionConnectLoginQueryParams>(params)}`;
