import { AbsoluteUrl, ShortLinkId } from "shared";

export interface ShortLinkRepository {
  save(shortLinkId: ShortLinkId, url: AbsoluteUrl): Promise<void>;
}
