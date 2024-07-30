import { AbsoluteUrl, ShortLinkId } from "shared";

export interface ShortLinkQuery {
  getById(id: ShortLinkId): Promise<AbsoluteUrl>;
}
