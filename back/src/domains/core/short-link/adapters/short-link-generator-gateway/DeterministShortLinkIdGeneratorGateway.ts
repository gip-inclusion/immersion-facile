import { ShortLinkId } from "shared";
import { ShortLinkIdGeneratorGateway } from "../../ports/ShortLinkIdGeneratorGateway";

export class DeterministShortLinkIdGeneratorGateway
  implements ShortLinkIdGeneratorGateway
{
  #nextShortLinkIds: ShortLinkId[] = [];

  //For testing purpose
  public addMoreShortLinkIds(nextShortlinkIds: ShortLinkId[]) {
    this.#nextShortLinkIds = [...this.#nextShortLinkIds, ...nextShortlinkIds];
  }

  public generate(): ShortLinkId {
    const nextShortLink = this.#nextShortLinkIds.shift();
    if (nextShortLink) return nextShortLink;
    throw new Error("No more shortlinkIds available. Please be determinist.");
  }
}
