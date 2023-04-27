import { ShortLinkGenerator } from "../../../domain/core/ports/ShortLinkGenerator";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";

export class DeterministShortLinkGenerator implements ShortLinkGenerator {
  generate(): ShortLinkId {
    const nextShortLink = this.nextShortLinkIds.shift();
    if (nextShortLink) return nextShortLink;
    throw new Error("No more shortlinkIds available. Please be determinist.");
  }

  //For testing purpose
  public addMoreShortLinkIds(nextShortlinkIds: ShortLinkId[]) {
    this.nextShortLinkIds = [...this.nextShortLinkIds, ...nextShortlinkIds];
  }

  private nextShortLinkIds: ShortLinkId[] = [];
}
