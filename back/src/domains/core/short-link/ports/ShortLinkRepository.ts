import type { AbsoluteUrl, ShortLinkId } from "shared";

export interface ShortLinkRepository {
  save(
    shortLinkId: ShortLinkId,
    url: AbsoluteUrl,
    singleUse: boolean,
  ): Promise<void>;
  markAsUsed(shortLinkId: ShortLinkId, lastUsedAt: Date): Promise<void>;
}
