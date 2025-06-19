import {
  type AbsoluteUrl,
  absoluteUrlSchema,
  castError,
  errors,
  type ShortLinkId,
} from "shared";
import type { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../../utils/logger";
import type { ShortLinkQuery } from "../../ports/ShortLinkQuery";

const logger = createLogger(__filename);

export class PgShortLinkQuery implements ShortLinkQuery {
  constructor(protected transaction: KyselyDb) {}

  public getById(shortLinkId: ShortLinkId): Promise<AbsoluteUrl> {
    logger.info({ message: `PgShortLinkQueryGetById ${shortLinkId}` });
    return this.transaction
      .selectFrom("short_links")
      .where("short_link_id", "=", shortLinkId)
      .select(["short_link_id", "url"])
      .executeTakeFirst()
      .then((result) => {
        if (!result) throw errors.shortLink.notFound({ shortLinkId });
        logger.info({
          message: `PgShortLinkQueryGetByIdSuccess ${result.short_link_id}`,
        });
        return absoluteUrlSchema.parse(result.url);
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
