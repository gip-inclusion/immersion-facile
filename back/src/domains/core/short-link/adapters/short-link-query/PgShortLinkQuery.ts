import { absoluteUrlSchema, castError, errors, type ShortLinkId } from "shared";
import type { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../../utils/logger";
import type { ShortLink, ShortLinkQuery } from "../../ports/ShortLinkQuery";

const logger = createLogger(__filename);

export class PgShortLinkQuery implements ShortLinkQuery {
  constructor(protected transaction: KyselyDb) {}

  public getById(shortLinkId: ShortLinkId): Promise<ShortLink> {
    logger.info({ message: `PgShortLinkQueryGetById ${shortLinkId}` });
    return this.transaction
      .selectFrom("short_links")
      .where("short_link_id", "=", shortLinkId)
      .select(["short_link_id", "url", "single_use", "last_used_at"])
      .executeTakeFirst()
      .then((result) => {
        if (!result) throw errors.shortLink.notFound({ shortLinkId });
        logger.info({
          message: `PgShortLinkQueryGetByIdSuccess ${result.short_link_id}`,
        });
        return {
          url: absoluteUrlSchema.parse(result.url),
          singleUse: result.single_use,
          lastUsedAt: result.last_used_at,
        };
      })
      .catch((error) => {
        logger.error({
          error: castError(error),
          message: "PgShortLinkQueryGetByIdError",
        });
        throw error;
      });
  }
}
