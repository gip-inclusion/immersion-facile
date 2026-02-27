import { uniq, values } from "ramda";
import { isTruthy, type ShortLinkId } from "shared";
import type { ShortLink, ShortLinkQuery } from "../../ports/ShortLinkQuery";

export class InMemoryShortLinkQuery implements ShortLinkQuery {
  protected shortLinks: Partial<Record<ShortLinkId, ShortLink>> = {};

  public async getById(
    shortLinkId: ShortLinkId,
  ): Promise<ShortLink | undefined> {
    return this.shortLinks[shortLinkId];
  }

  public getShortLinks(): Array<ShortLink> {
    return values(this.shortLinks).filter(isTruthy);
  }

  //For testing purpose
  public setShortLinks(shortLinks: Array<ShortLink>): void {
    const ids = shortLinks.map(({ id }) => id);
    if (uniq(ids).length !== ids.length)
      throw new Error(`duplicate shortLinkIds detected : ${ids}`);
    this.shortLinks = shortLinks.reduce<Record<ShortLinkId, ShortLink>>(
      (acc, shortLink) => ({
        ...acc,
        [shortLink.id]: shortLink,
      }),
      {},
    );
  }
}
