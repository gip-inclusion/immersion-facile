import type { ShortLink } from "./ShortLinkQuery";

export interface ShortLinkRepository {
  save(shortLink: ShortLink): Promise<void>;
}
