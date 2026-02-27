import { errors } from "shared";
import type { ShortLink } from "../../ports/ShortLinkQuery";
import type { ShortLinkRepository } from "../../ports/ShortLinkRepository";
import { PgShortLinkQuery } from "../short-link-query/PgShortLinkQuery";

export class PgShortLinkRepository
  extends PgShortLinkQuery
  implements ShortLinkRepository
{
  public async save(shortLink: ShortLink): Promise<void> {
    return this.transaction
      .insertInto("short_links")
      .values({
        short_link_id: shortLink.id,
        url: shortLink.url,
        last_used_at: shortLink.lastUsedAt,
      })
      .onConflict((oc) =>
        oc
          .column("short_link_id")
          .doUpdateSet({
            last_used_at: (eb) => eb.ref("excluded.last_used_at"),
          })
          .where("short_links.url", "=", (eb) => eb.ref("excluded.url")),
      )
      .executeTakeFirst()
      .then((result) => {
        if (!result.numInsertedOrUpdatedRows)
          throw errors.shortLink.forbiddenLinkUpdate();
      });
  }
}
