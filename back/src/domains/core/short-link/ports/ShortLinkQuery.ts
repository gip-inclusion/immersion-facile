import type { AbsoluteUrl, ShortLinkId } from "shared";

export type ShortLink = {
  url: AbsoluteUrl;
  singleUse: boolean;
  lastUsedAt: Date | null;
};

export interface ShortLinkQuery {
  getById(id: ShortLinkId): Promise<ShortLink>;
}
