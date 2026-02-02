import {
  type AbsoluteUrl,
  type CreateConventionMagicLinkPayloadProperties,
  filterNotFalsy,
} from "shared";
import type { GenerateConventionMagicLinkUrl } from "../config/bootstrap/magicLinkUrl";
import type { GenerateApiConsumerJwt } from "../domains/core/jwt";

export const generateApiConsumerJwtTestFn: GenerateApiConsumerJwt = ({
  id,
  iat,
  version,
}) => `FAKE-API-CONSUMER-JWT-${id}-version-${version}-iat-${iat}`;

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLinkUrl = ({
  email,
  id,
  now,
  iat,
  version,
  role,
  targetRoute,
  lifetime = "short",
  extraQueryParams = {},
}: CreateConventionMagicLinkPayloadProperties & {
  extraQueryParams?: Record<string, string>;
  targetRoute: string;
  lifetime?: "short" | "long";
}) => {
  const fakeJwt = [id, role, now.toISOString(), email, iat, version, lifetime]
    .filter(filterNotFalsy)
    .join("/");

  const queryParams = Object.entries(extraQueryParams).map(
    ([key, value]) => `${key}=${value}`,
  );
  return [
    "http://fake-magic-link",
    targetRoute,
    fakeJwt,
    ...(queryParams.length ? [queryParams.join("&")] : []),
  ].join("/") as AbsoluteUrl;
};
