import type { AbsoluteUrl, ShortLinkId } from "shared";
import type { ShortLinkRepository } from "../../ports/ShortLinkRepository";
import { InMemoryShortLinkQuery } from "../short-link-query/InMemoryShortLinkQuery";

export class InMemoryShortLinkRepository
  extends InMemoryShortLinkQuery
  implements ShortLinkRepository
{
  public async save(shortLinkId: ShortLinkId, url: AbsoluteUrl): Promise<void> {
    this.shortLinks[shortLinkId] = url;
  }
}
