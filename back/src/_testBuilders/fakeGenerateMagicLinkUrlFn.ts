import { CreateConventionMagicLinkPayloadProperties } from "shared";
import { GenerateConventionMagicLink } from "../adapters/primary/config/createGenerateConventionMagicLink";

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLink = (
  props: CreateConventionMagicLinkPayloadProperties & { targetRoute: string },
) =>
  `http://fake-magic-link/${props.id}/${props.targetRoute}/${
    props.role
  }/${props.now.toISOString()}`;
