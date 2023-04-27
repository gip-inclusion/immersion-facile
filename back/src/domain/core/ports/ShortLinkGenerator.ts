import { ShortLinkId } from "./ShortLinkQuery";

export interface ShortLinkGenerator {
  generate(): ShortLinkId;
}
