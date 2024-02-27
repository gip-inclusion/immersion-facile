import { AbsoluteUrl, castError } from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../../../adapters/secondary/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../../utils/logger";
import { ShortLinkId, ShortLinkQuery } from "../../ports/ShortLinkQuery";
import {
  PgShortLinkRepositoryDto,
  pgGetShortLinkByIdResultsSchema,
  pgShortLinkRepositoryStructure,
} from "../PgShortLinkHelpers";

const logger = createLogger(__filename);

export class PgShortLinkQuery implements ShortLinkQuery {
  constructor(protected transaction: KyselyDb) {}

  public getById(shortLinkId: ShortLinkId): Promise<AbsoluteUrl> {
    logger.info({ shortLinkId }, "PgShortLinkQueryGetByIdTotal");
    return executeKyselyRawSqlQuery<PgShortLinkRepositoryDto>(
      this.transaction,
      `SELECT * FROM ${pgShortLinkRepositoryStructure.tableName} WHERE ${pgShortLinkRepositoryStructure.columnNames.shortLinkId} = $1`,
      [shortLinkId],
    )
      .then(({ rows }) => {
        const result = pgGetShortLinkByIdResultsSchema.parse(rows).at(0);
        if (!result)
          throw new Error(shortLinkIdNotFoundErrorMessage(shortLinkId));
        logger.info(
          { shortLinkId: result.short_link_id },
          "PgShortLinkQueryGetByIdSuccess",
        );
        return result.url as AbsoluteUrl;
      })
      .catch((error) => {
        logger.error(
          { error: castError(error) },
          "PgShortLinkQueryGetByIdError",
        );
        throw error;
      });
  }
}
export const shortLinkIdNotFoundErrorMessage = (
  shortLinkId: ShortLinkId,
): string => `ShortLinkId '${shortLinkId}' not found.`;
