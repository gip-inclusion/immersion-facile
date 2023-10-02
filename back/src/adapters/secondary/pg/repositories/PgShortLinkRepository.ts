import { AbsoluteUrl } from "shared";
import { ShortLinkId } from "../../../../domain/core/ports/ShortLinkQuery";
import { ShortLinkRepository } from "../../../../domain/core/ports/ShortLinkRepository";
import { createLogger } from "../../../../utils/logger";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";
import {
  PgShortLinkRepositoryDto,
  pgShortLinkRepositorySchema,
  pgShortLinkRepositoryStructure,
} from "./PgShortLinkHelpers";
import { PgShortLinkQuery } from "./PgShortLinkQuery";

const logger = createLogger(__filename);

export class PgShortLinkRepository
  extends PgShortLinkQuery
  implements ShortLinkRepository
{
  constructor(transaction: KyselyDb) {
    super(transaction);
  }

  public async save(shortLinkId: ShortLinkId, url: AbsoluteUrl): Promise<void> {
    logger.info({ shortLinkId }, "pgShortLinkRepositorySaveTotal");

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
        logger.info(
          { short_link_id, created_at },
          "pgShortLinkRepositorySaveSuccess",
        );
      })
      .catch((error) => {
        logger.error({ error }, "pgShortLinkRepositorySaveFailed");
        throw error;
      });
  }
}
