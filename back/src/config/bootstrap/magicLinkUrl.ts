import type {
  AbsoluteUrl,
  CreateConventionMagicLinkPayloadProperties,
  OmitFromExistingKeys,
} from "shared";
import type { GenerateConventionJwt } from "../../domains/core/jwt";
import { createConventionMagicLinkPayload } from "../../utils/jwt";
import type { AppConfig } from "./appConfig";

export type GenerateConventionMagicLinkUrl = ReturnType<
  typeof makeGenerateConventionMagicLinkUrl
>;

export const makeGenerateConventionMagicLinkUrl =
  (config: AppConfig, generateJwt: GenerateConventionJwt) =>
  ({
    targetRoute,
    lifetime = "short",
    extraQueryParams = {},
    ...jwtPayload
  }: OmitFromExistingKeys<
    CreateConventionMagicLinkPayloadProperties,
    "durationDays"
  > & {
    extraQueryParams?: Record<string, string>;
    targetRoute: string;
    lifetime?: "short" | "long";
  }): AbsoluteUrl => {
    const jwt = generateJwt(
      createConventionMagicLinkPayload({
        ...jwtPayload,
        durationDays:
          lifetime === "short"
            ? config.magicLinkShortDurationInDays
            : config.magicLinkLongDurationInDays,
      }),
    );

    const queryParams = new URLSearchParams({
      ...extraQueryParams,
      jwt,
    });

    return `${config.immersionFacileBaseUrl}/${targetRoute}?${queryParams}`;
  };
