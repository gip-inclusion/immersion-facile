import { PoolClient } from "pg";
import { ApiConsumerId, ApiConsumer } from "shared";
import { ApiConsumerRepository } from "../../../domain/auth/ports/ApiConsumerRepository";
import { optional } from "./pgUtils";

export class PgApiConsumerRepository implements ApiConsumerRepository {
  constructor(private client: PoolClient) {}

  public async getById(id: ApiConsumerId): Promise<ApiConsumer | undefined> {
    const result = await this.client.query(
      "SELECT * FROM api_consumers WHERE id = $1",
      [id],
    );

    const rawPg = result.rows[0];
    return rawPg ? this.rawPgToApiConsumer(rawPg) : undefined;
  }

  private rawPgToApiConsumer(raw: any): ApiConsumer {
    return {
      id: raw.id,
      consumer: raw.consumer,
      description: optional(raw.description),
      isAuthorized: raw.is_authorized,
      createdAt: raw.created_at,
      expirationDate: raw.expiration_date,
    };
  }
}
