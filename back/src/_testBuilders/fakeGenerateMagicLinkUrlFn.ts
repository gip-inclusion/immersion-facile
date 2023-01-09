import { CreateConventionMagicLinkPayloadProperties } from "shared";
import { GenerateConventionMagicLink } from "../adapters/primary/config/createGenerateConventionMagicLink";

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLink = ({
  email,
  id,
  now,
  role,
  targetRoute,
}: CreateConventionMagicLinkPayloadProperties & { targetRoute: string }) =>
  `http://fake-magic-link/${id}/${targetRoute}/${role}/${now.toISOString()}/${email}`;
