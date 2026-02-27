import type { AbsoluteUrl, ShortLinkId } from "shared";

export type ShortLink = {
  id: ShortLinkId;
  url: AbsoluteUrl;
  lastUsedAt: Date | null;
};

export interface ShortLinkQuery {
  getById(id: ShortLinkId): Promise<ShortLink | undefined>;
}
