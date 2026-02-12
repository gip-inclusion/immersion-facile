import { type AbsoluteUrl, errors, type ShortLinkId } from "shared";
import type { ShortLinkRepository } from "../../ports/ShortLinkRepository";
import { InMemoryShortLinkQuery } from "../short-link-query/InMemoryShortLinkQuery";

export class InMemoryShortLinkRepository
  extends InMemoryShortLinkQuery
  implements ShortLinkRepository
{
  public async save(
    shortLinkId: ShortLinkId,
    url: AbsoluteUrl,
    singleUse: boolean,
  ): Promise<void> {
    this.shortLinks[shortLinkId] = {
      url,
      singleUse,
      lastUsedAt: null,
    };
  }

  public async markAsUsed(
    shortLinkId: ShortLinkId,
    lastUsedAt: Date,
  ): Promise<void> {
    const data = this.shortLinks[shortLinkId];
    if (!data) throw errors.shortLink.notFound({ shortLinkId });
    data.lastUsedAt = lastUsedAt;
  }
}
