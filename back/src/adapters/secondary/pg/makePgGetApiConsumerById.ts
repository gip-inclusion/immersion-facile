import { PoolClient } from "pg";
import { GetApiConsumerById } from "../../../domain/core/ports/GetApiConsumerById";
import { ApiConsumer, ApiConsumerId } from "shared";
import { optional } from "./pgUtils";

const rawPgToApiConsumer = (raw: any): ApiConsumer => ({
  id: raw.id,
  consumer: raw.consumer,
  description: optional(raw.description),
  isAuthorized: raw.is_authorized,
  createdAt: raw.created_at,
  expirationDate: raw.expiration_date,
});

export const makePgGetApiConsumerById =
  (client: PoolClient): GetApiConsumerById =>
  async (id: ApiConsumerId) => {
    const result = await client.query(
      "SELECT * FROM api_consumers WHERE id = $1",
      [id],
    );

    const rawPg = result.rows[0];
    return rawPg ? rawPgToApiConsumer(rawPg) : undefined;
  };
