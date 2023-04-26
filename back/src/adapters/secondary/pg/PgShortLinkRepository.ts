import { AbsoluteUrl } from "shared";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";
import { ShortLinkRepository } from "../../../domain/core/ports/ShortLinkRepository";
import { PgShortLinkQuery } from "./PgShortLinkQuery";

export class PgShortLinkRepository
  extends PgShortLinkQuery
  implements ShortLinkRepository
{
  save(_shortLinkId: ShortLinkId, _url: AbsoluteUrl): Promise<void> {
    // TODO
    throw new Error("Method not implemented.");
  }
}
