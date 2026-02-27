import type {
  AbsoluteUrl,
  ShortLinkId,
  ZodSchemaWithInputMatchingOutput,
} from "shared";
import { z } from "zod";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { ShortLink } from "../ports/ShortLinkQuery";

type PgShortLinkRepositoryDto = {
  short_link_id: string;
  url: string;
  created_at: Date;
};

export const pgShortLinkRepositorySchema: ZodSchemaWithInputMatchingOutput<PgShortLinkRepositoryDto> =
  z.object({
    short_link_id: z.string().nonempty(),
    url: z.string().url(),
    created_at: z.date(),
  });

export const insertShortLinkQuery = async (
  db: KyselyDb,
  shortLink: ShortLink,
): Promise<void> => {
  await db
    .insertInto("short_links")
    .values({
      short_link_id: shortLink.id,
      url: shortLink.url,
      last_used_at: shortLink.lastUsedAt,
    })
    .execute();
};

export const getAllShortLinks = async (db: KyselyDb): Promise<ShortLink[]> =>
  db
    .selectFrom("short_links")
    .selectAll()
    .execute()
    .then((results) =>
      results.map(
        (result) =>
          ({
            id: result.short_link_id,
            lastUsedAt: result.last_used_at,
            url: result.url as AbsoluteUrl,
          }) satisfies ShortLink,
      ),
    );

export const deleteShortLinkById = async (
  transaction: KyselyDb,
  shortLinkId: ShortLinkId,
): Promise<void> => {
  await transaction
    .deleteFrom("short_links")
    .where("short_link_id", "=", shortLinkId)
    .execute();
};
