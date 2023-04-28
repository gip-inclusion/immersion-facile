import { ShortLinkId } from "./ShortLinkQuery";

export interface ShortLinkIdGeneratorGateway {
  generate(): ShortLinkId;
}
