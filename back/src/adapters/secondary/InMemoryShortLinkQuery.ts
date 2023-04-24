import { AbsoluteUrl } from "shared";
import {
  ShortLinkId,
  shortLinkNotFoundMessage,
  ShortLinkQuery,
} from "../../domain/core/ports/ShortLinkQuery";
import { NotFoundError } from "../primary/helpers/httpErrors";

export class InMemoryShortLinkQuery implements ShortLinkQuery {
  public async getById(shortLinkId: ShortLinkId): Promise<AbsoluteUrl> {
    const longLink = this.shortLinks[shortLinkId];
    if (longLink) return longLink;
    throw new NotFoundError(shortLinkNotFoundMessage(shortLinkId));
  }

  //For testing purpose
  public setShortLinks(shortLinks: Record<ShortLinkId, AbsoluteUrl>): void {
    this.shortLinks = shortLinks;
  }

  private shortLinks: Partial<Record<ShortLinkId, AbsoluteUrl>> = {};
}
