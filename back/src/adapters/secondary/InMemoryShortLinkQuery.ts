import { AbsoluteUrl } from "shared";
import { shortLinkNotFoundMessage } from "../../domain/core/ShortLink";
import {
  ShortLinkId,
  ShortLinkQuery,
} from "../../domain/core/ports/ShortLinkQuery";
import { NotFoundError } from "../primary/helpers/httpErrors";

export class InMemoryShortLinkQuery implements ShortLinkQuery {
  protected shortLinks: Partial<Record<ShortLinkId, AbsoluteUrl>> = {};

  public async getById(shortLinkId: ShortLinkId): Promise<AbsoluteUrl> {
    const longLink = this.shortLinks[shortLinkId];
    if (longLink) return longLink;
    throw new NotFoundError(shortLinkNotFoundMessage(shortLinkId));
  }

  public getShortLinks(): Partial<Record<ShortLinkId, AbsoluteUrl>> {
    return this.shortLinks;
  }

  //For testing purpose
  public setShortLinks(shortLinks: Record<ShortLinkId, AbsoluteUrl>): void {
    this.shortLinks = shortLinks;
  }
}
