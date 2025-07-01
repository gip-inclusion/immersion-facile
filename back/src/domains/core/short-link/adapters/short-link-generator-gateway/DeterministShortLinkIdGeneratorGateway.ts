import { errors, type ShortLinkId } from "shared";
import type { ShortLinkIdGeneratorGateway } from "../../ports/ShortLinkIdGeneratorGateway";

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
    if (!nextShortLink)
      throw errors.generic.fakeError(
        "No more shortlinkIds available. Please be determinist.",
      );
    return nextShortLink;
  }
}
