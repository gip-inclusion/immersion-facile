import { QueryConfig } from "pg";
import { z } from "zod";
import { AbsoluteUrl } from "shared";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";

export type PgShortLinkRepositoryDto = {
  short_link_id: string;
  url: string;
  created_at: Date;
};

export const pgShortLinkRepositorySchema: z.Schema<PgShortLinkRepositoryDto> =
  z.object({
    short_link_id: z.string().nonempty(),
    url: z.string().url(),
    created_at: z.date(),
  });

export const pgGetShortLinkByIdResultsSchema: z.Schema<
  PgShortLinkRepositoryDto[]
> = z.array(pgShortLinkRepositorySchema);

export const pgShortLinkRepositoryStructure = {
  tableName: "short_link_repository",
  columnNames: {
    shortLinkId: "short_link_id",
    url: "url",
    createAt: "created_at",
  },
};

export const insertShortLinkQuery = (
  shortLinkId: ShortLinkId,
  url: AbsoluteUrl,
): QueryConfig<
  [PgShortLinkRepositoryDto["short_link_id"], PgShortLinkRepositoryDto["url"]]
> => {
  const columns = [
    pgShortLinkRepositoryStructure.columnNames.shortLinkId,
    pgShortLinkRepositoryStructure.columnNames.url,
  ];
  return {
    text: `
      INSERT INTO ${pgShortLinkRepositoryStructure.tableName} (${columns}) 
      VALUES ($1, $2)
    `,
    values: [shortLinkId, url],
  };
};

export const getShortLinkByIdQuery = (
  shortlinkId: ShortLinkId,
): QueryConfig<[PgShortLinkRepositoryDto["short_link_id"]]> => ({
  text: `
    SELECT *
    FROM ${pgShortLinkRepositoryStructure.tableName} 
    WHERE ${pgShortLinkRepositoryStructure.columnNames.shortLinkId} = $1
  `,
  values: [shortlinkId],
});

export const deleteShortLinkByIdQuery = (
  shortLinkId: ShortLinkId,
): QueryConfig<[PgShortLinkRepositoryDto["short_link_id"]]> => ({
  text: `
    DELETE
    FROM ${pgShortLinkRepositoryStructure.tableName}
    WHERE ${pgShortLinkRepositoryStructure.columnNames.shortLinkId} = $1
  `,
  values: [shortLinkId],
});
