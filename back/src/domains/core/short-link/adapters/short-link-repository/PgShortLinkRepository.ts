import { AbsoluteUrl, ShortLinkId, castError } from "shared";
import { z } from "zod";
import { createLogger } from "../../../../../utils/logger";
import { ShortLinkRepository } from "../../ports/ShortLinkRepository";
import { pgShortLinkRepositorySchema } from "../PgShortLinkHelpers";
import { PgShortLinkQuery } from "../short-link-query/PgShortLinkQuery";

const logger = createLogger(__filename);

export class PgShortLinkRepository
  extends PgShortLinkQuery
  implements ShortLinkRepository
{
  public async save(shortLinkId: ShortLinkId, url: AbsoluteUrl): Promise<void> {
    logger.info({ message: `pgShortLinkRepositorySave ${shortLinkId}` });
    return this.transaction
      .insertInto("short_links")
      .values({
        short_link_id: shortLinkId,
        url,
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
}
