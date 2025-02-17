import {
  CreateConventionMagicLinkPayloadProperties,
  filterNotFalsy,
} from "shared";
import { GenerateConventionMagicLinkUrl } from "../config/bootstrap/magicLinkUrl";
import { GenerateApiConsumerJwt } from "../domains/core/jwt";

export const generateApiConsumerJwtTestFn: GenerateApiConsumerJwt = ({ id }) =>
  `FAKE-API-CONSUMER-JWT-${id}`;

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLinkUrl = ({
  email,
  id,
  now,
  iat,
  version,
  role,
  targetRoute,
  lifetime = "short",
}: CreateConventionMagicLinkPayloadProperties & {
  targetRoute: string;
  lifetime?: "short" | "long";
}) => {
  const fakeJwt = [id, role, now.toISOString(), email, iat, version, lifetime]
    .filter(filterNotFalsy)
    .join("/");
  return `http://fake-magic-link/${targetRoute}/${fakeJwt}`;
};
