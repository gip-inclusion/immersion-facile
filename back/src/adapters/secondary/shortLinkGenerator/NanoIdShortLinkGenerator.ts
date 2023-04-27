import { ShortLinkGenerator } from "../../../domain/core/ports/ShortLinkGenerator";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";

export class NanoIdShortLinkGenerator implements ShortLinkGenerator {
  generate(): ShortLinkId {
    // TODO
    throw new Error("Method not implemented.");
  }
}
