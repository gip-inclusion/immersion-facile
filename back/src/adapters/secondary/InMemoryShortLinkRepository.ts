import { AbsoluteUrl } from "shared";
import { ShortLinkId } from "../../domain/core/ports/ShortLinkQuery";
import { ShortLinkRepository } from "../../domain/core/ports/ShortLinkRepository";
import { InMemoryShortLinkQuery } from "./InMemoryShortLinkQuery";

export class InMemoryShortLinkRepository
  extends InMemoryShortLinkQuery
  implements ShortLinkRepository
{
  public async save(shortLinkId: ShortLinkId, url: AbsoluteUrl): Promise<void> {
    this.shortLinks[shortLinkId] = url;
  }
}
