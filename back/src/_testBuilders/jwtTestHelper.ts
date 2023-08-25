import {
  CreateConventionMagicLinkPayloadProperties,
  filterNotFalsy,
} from "shared";
import { GenerateConventionMagicLinkUrl } from "../adapters/primary/config/magicLinkUrl";
import {
  GenerateApiConsumerJwt,
  GenerateConventionJwt,
} from "../domain/auth/jwt";

export const generateApiConsumerJwtTestFn: GenerateApiConsumerJwt = ({ id }) =>
  `FAKE-API-CONSUMER-JWT-${id}`;

export const generateConventionJwtTestFn: GenerateConventionJwt = ({
  applicationId,
  emailHash,
  role,
  iat,
}) => `${applicationId};${role};${iat}:${emailHash}`;

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
