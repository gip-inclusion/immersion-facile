import { Kysely } from "kysely";
import { AbsoluteUrl } from "shared";
import {
  ShortLinkId,
  ShortLinkQuery,
} from "../../../domain/core/ports/ShortLinkQuery";
import { createLogger } from "../../../utils/logger";
import { executeKyselyRawSqlQuery, ImmersionDatabase } from "./sql/database";
import {
  pgGetShortLinkByIdResultsSchema,
  PgShortLinkRepositoryDto,
  pgShortLinkRepositoryStructure,
} from "./pgShortLinkHelpers";

const logger = createLogger(__filename);

export class PgShortLinkQuery implements ShortLinkQuery {
  constructor(protected transaction: Kysely<ImmersionDatabase>) {}

  public getById(shortLinkId: ShortLinkId): Promise<AbsoluteUrl> {
    logger.info({ shortLinkId }, "PgShortLinkQueryGetByIdTotal");
    const query = `
      SELECT *
      FROM ${pgShortLinkRepositoryStructure.tableName}
      WHERE ${pgShortLinkRepositoryStructure.columnNames.shortLinkId} = $1
    `;
    return executeKyselyRawSqlQuery<PgShortLinkRepositoryDto>(
      this.transaction,
      query,
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
        logger.error({ error }, "PgShortLinkQueryGetByIdError");
        throw error;
      });
  }
}
export const shortLinkIdNotFoundErrorMessage = (
  shortLinkId: ShortLinkId,
): string => `ShortLinkId '${shortLinkId}' not found.`;
