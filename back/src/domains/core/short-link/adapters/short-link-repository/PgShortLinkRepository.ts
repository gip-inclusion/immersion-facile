import { AbsoluteUrl, castError } from "shared";
import { executeKyselyRawSqlQuery } from "../../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../../utils/logger";
import { ShortLinkId } from "../../ports/ShortLinkQuery";
import { ShortLinkRepository } from "../../ports/ShortLinkRepository";
import {
  PgShortLinkRepositoryDto,
  pgShortLinkRepositorySchema,
  pgShortLinkRepositoryStructure,
} from "../PgShortLinkHelpers";
import { PgShortLinkQuery } from "../short-link-query/PgShortLinkQuery";

const logger = createLogger(__filename);

export class PgShortLinkRepository
  extends PgShortLinkQuery
  implements ShortLinkRepository
{
  public async save(shortLinkId: ShortLinkId, url: AbsoluteUrl): Promise<void> {
    logger.info({ message: `pgShortLinkRepositorySave ${shortLinkId}` });

    const query = `INSERT INTO ${pgShortLinkRepositoryStructure.tableName}(${[
      pgShortLinkRepositoryStructure.columnNames.shortLinkId,
      pgShortLinkRepositoryStructure.columnNames.url,
    ]}) VALUES($1, $2) RETURNING *`;

    return executeKyselyRawSqlQuery<PgShortLinkRepositoryDto>(
      this.transaction,
      query,
      [shortLinkId, url],
    )
      .then(({ rows }) => {
        const result = rows.at(0);
        if (!result)
          throw new Error(`${shortLinkId} was not saved on repository.`);
        const { short_link_id, created_at } =
          pgShortLinkRepositorySchema.parse(result);
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
