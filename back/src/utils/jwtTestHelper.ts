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
  exp,
  durationDays,
  iat,
  version,
  role,
  targetRoute,
}: CreateConventionMagicLinkPayloadProperties & { targetRoute: string }) => {
  const fakeJwt = [
    id,
    role,
    now.toISOString(),
    email,
    exp,
    durationDays,
    iat,
    version,
  ]
    .filter(filterNotFalsy)
    .join("/");
  return `http://fake-magic-link/${targetRoute}/${fakeJwt}`;
};
