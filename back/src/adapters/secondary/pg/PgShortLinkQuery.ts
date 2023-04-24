import { AbsoluteUrl } from "shared";
import {
  ShortLinkId,
  ShortLinkQuery,
} from "../../../domain/core/ports/ShortLinkQuery";

export class PgShortLinkQuery implements ShortLinkQuery {
  getById(_shortLinkId: ShortLinkId): Promise<AbsoluteUrl> {
    throw new Error("Method not implemented.");
  }
}
