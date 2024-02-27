import { AbsoluteUrl } from "shared";
import { ShortLinkId } from "./ShortLinkQuery";

export interface ShortLinkRepository {
  save(shortLinkId: ShortLinkId, url: AbsoluteUrl): Promise<void>;
}
