import { type AbsoluteUrl, errors, type ShortLinkId } from "shared";
import type { ShortLinkQuery } from "../../ports/ShortLinkQuery";

export class InMemoryShortLinkQuery implements ShortLinkQuery {
  protected shortLinks: Partial<Record<ShortLinkId, AbsoluteUrl>> = {};

  public async getById(shortLinkId: ShortLinkId): Promise<AbsoluteUrl> {
    const longLink = this.shortLinks[shortLinkId];
    if (longLink) return longLink;
    throw errors.shortLink.notFound({ shortLinkId });
  }

  public getShortLinks(): Partial<Record<ShortLinkId, AbsoluteUrl>> {
    return this.shortLinks;
  }

  //For testing purpose
  public setShortLinks(shortLinks: Record<ShortLinkId, AbsoluteUrl>): void {
    this.shortLinks = shortLinks;
  }
}
