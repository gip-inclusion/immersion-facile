import { PoolClient, QueryConfig } from "pg";
import { AbsoluteUrl } from "shared";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";
import { ShortLinkRepository } from "../../../domain/core/ports/ShortLinkRepository";
import { createLogger } from "../../../utils/logger";
import {
  PgShortLinkRepositoryDto,
  pgShortLinkRepositorySchema,
  pgShortLinkRepositoryStructure,
} from "./pgShortLinkHelpers";
import { PgShortLinkQuery } from "./PgShortLinkQuery";

const logger = createLogger(__filename);

export class PgShortLinkRepository
  extends PgShortLinkQuery
  implements ShortLinkRepository
{
  constructor(client: PoolClient) {
    super(client);
  }

  public async save(shortLinkId: ShortLinkId, url: AbsoluteUrl): Promise<void> {
    logger.info({ shortLinkId }, "pgShortLinkRepositorySaveTotal");

    return this.client
      .query<PgShortLinkRepositoryDto>(insertShortLinkQuery(shortLinkId, url))
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

const insertShortLinkQuery = (
  shortLinkId: ShortLinkId,
  url: AbsoluteUrl,
): QueryConfig<
  [PgShortLinkRepositoryDto["short_link_id"], PgShortLinkRepositoryDto["url"]]
> => ({
  text: `INSERT INTO ${pgShortLinkRepositoryStructure.tableName}(${[
    pgShortLinkRepositoryStructure.columnNames.shortLinkId,
    pgShortLinkRepositoryStructure.columnNames.url,
  ]}) VALUES($1, $2) RETURNING *`,
  values: [shortLinkId, url],
});
