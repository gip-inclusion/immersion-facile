import { ShortLinkId } from "shared";

export interface ShortLinkIdGeneratorGateway {
  generate(): ShortLinkId;
}
