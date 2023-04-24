import { AbsoluteUrl, Flavor } from "shared";

export type ShortLinkId = Flavor<string, "ShortLinkId">;

export interface ShortLinkQuery {
  getById(id: ShortLinkId): Promise<AbsoluteUrl>;
}

export const shortLinkNotFoundMessage = (shortLinkId: ShortLinkId): string =>
  `Short link '${shortLinkId}' not found.`;
