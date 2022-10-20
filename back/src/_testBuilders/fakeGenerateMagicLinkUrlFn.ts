import { ConventionId, Role } from "shared";
import { GenerateConventionMagicLink } from "../adapters/primary/config/createGenerateConventionMagicLink";

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLink = ({
  id,
  role,
  targetRoute,
}: {
  id: ConventionId;
  role: Role;
  targetRoute: string;
}) => `http://fake-magic-link/${id}/${targetRoute}/${role}`;
