import { absoluteUrlSchema, type ShortLinkId } from "shared";
import type { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../../utils/logger";
import type { ShortLink, ShortLinkQuery } from "../../ports/ShortLinkQuery";

const logger = createLogger(__filename);

export class PgShortLinkQuery implements ShortLinkQuery {
  constructor(protected transaction: KyselyDb) {}

  public getById(shortLinkId: ShortLinkId): Promise<ShortLink | undefined> {
    logger.info({ message: `PgShortLinkQueryGetById ${shortLinkId}` });
    return this.transaction
      .selectFrom("short_links")
      .where("short_link_id", "=", shortLinkId)
      .select(["short_link_id", "url", "last_used_at"])
      .executeTakeFirst()
      .then((result) =>
        result
          ? {
              id: result.short_link_id,
              url: absoluteUrlSchema.parse(result.url),
              lastUsedAt: result.last_used_at,
            }
          : undefined,
      );
  }
}
