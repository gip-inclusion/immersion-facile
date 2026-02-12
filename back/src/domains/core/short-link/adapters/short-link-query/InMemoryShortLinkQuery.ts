import { errors, type ShortLinkId } from "shared";
import type { ShortLink, ShortLinkQuery } from "../../ports/ShortLinkQuery";

export class InMemoryShortLinkQuery implements ShortLinkQuery {
  protected shortLinks: Partial<Record<ShortLinkId, ShortLink>> = {};

  public async getById(shortLinkId: ShortLinkId): Promise<ShortLink> {
    const data = this.shortLinks[shortLinkId];
    if (data) return data;
    throw errors.shortLink.notFound({ shortLinkId });
  }

  public getShortLinks(): Partial<Record<ShortLinkId, ShortLink>> {
    return this.shortLinks;
  }

  //For testing purpose
  public setShortLinks(shortLinks: Record<ShortLinkId, ShortLink>): void {
    this.shortLinks = shortLinks;
  }
}
