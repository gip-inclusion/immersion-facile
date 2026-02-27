import { errors } from "shared";
import type { ShortLink } from "../../ports/ShortLinkQuery";
import type { ShortLinkRepository } from "../../ports/ShortLinkRepository";
import { InMemoryShortLinkQuery } from "../short-link-query/InMemoryShortLinkQuery";

export class InMemoryShortLinkRepository
  extends InMemoryShortLinkQuery
  implements ShortLinkRepository
{
  public async save(shortLink: ShortLink): Promise<void> {
    const existingShortLink = this.shortLinks[shortLink.id];
    if (existingShortLink && existingShortLink.url !== shortLink.url)
      throw errors.shortLink.forbiddenLinkUpdate();
    this.shortLinks[shortLink.id] = shortLink;
  }
}
