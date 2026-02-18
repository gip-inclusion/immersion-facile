import { type AbsoluteUrl, castError, errors, type ShortLinkId } from "shared";
import { z } from "zod";
import { createLogger } from "../../../../../utils/logger";
import type { ShortLinkRepository } from "../../ports/ShortLinkRepository";
import { pgShortLinkRepositorySchema } from "../PgShortLinkHelpers";
import { PgShortLinkQuery } from "../short-link-query/PgShortLinkQuery";

const logger = createLogger(__filename);

export class PgShortLinkRepository
  extends PgShortLinkQuery
  implements ShortLinkRepository
{
  public async save(
    shortLinkId: ShortLinkId,
    url: AbsoluteUrl,
    singleUse: boolean,
  ): Promise<void> {
    logger.info({ message: `pgShortLinkRepositorySave ${shortLinkId}` });
    return this.transaction
      .insertInto("short_links")
      .values({
        short_link_id: shortLinkId,
        url,
        single_use: singleUse,
      })
      .returningAll()
      .execute()
      .then((results) => {
        const [{ short_link_id, created_at }] = z
          .array(pgShortLinkRepositorySchema)
          .length(1)
          .parse(results);
        logger.info({
          message: `pgShortLinkRepositorySaveSuccess with short_link_id = ${short_link_id} and created_at = ${created_at}`,
        });
      })
      .catch((error) => {
        logger.error({
          error: castError(error),
          message: "pgShortLinkRepositorySaveFailed",
        });
        throw error;
      });
  }

  public async markAsUsed(
    shortLinkId: ShortLinkId,
    lastUsedAt: Date,
  ): Promise<void> {
    const result = await this.transaction
      .updateTable("short_links")
      .set({ last_used_at: lastUsedAt })
      .where("short_link_id", "=", shortLinkId)
      .returning("short_link_id")
      .executeTakeFirst();

    if (!result) throw errors.shortLink.notFound({ shortLinkId });
  }
}
