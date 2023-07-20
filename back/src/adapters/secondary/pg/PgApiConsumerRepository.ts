import { CompiledQuery, Kysely } from "kysely";
import { ApiConsumer, ApiConsumerId, apiConsumerSchema } from "shared";
import { ApiConsumerRepository } from "../../../domain/auth/ports/ApiConsumerRepository";
import { executeKyselyRawSqlQuery, ImmersionDatabase } from "./sql/database";
import { optional } from "./pgUtils";

export class PgApiConsumerRepository implements ApiConsumerRepository {
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  public async getById(id: ApiConsumerId): Promise<ApiConsumer | undefined> {
    const result = await this.transaction.executeQuery<any>(
      CompiledQuery.raw("SELECT * FROM api_consumers WHERE id = $1", [id]),
    );

    const rawPg = result.rows[0];
    return rawPg ? this.#rawPgToApiConsumer(rawPg) : undefined;
  }

  public async save(apiConsumer: ApiConsumer): Promise<void> {
    await executeKyselyRawSqlQuery(
      this.transaction,
      `
          INSERT INTO api_consumers (
              id, consumer, description, is_authorized, created_at,
              expiration_date, contact_emails, contact_first_name, contact_last_name, contact_job,
              contact_phone
          ) VALUES(
                      $1, $2, $3, $4, $5,
                      $6, $7, $8, $9, $10,
                      $11
                  )
              ON CONFLICT (id) DO UPDATE
                                      SET (
                                      id, consumer, description, is_authorized, created_at,
                                      expiration_date, contact_emails, contact_first_name, contact_last_name, contact_job,
                                      contact_phone
                                      ) = (
                                      $1, $2, $3, $4, $5,
                                      $6, $7, $8, $9, $10,
                                      $11
                                      )`,
      //prettier-ignore
      [
        apiConsumer.id, apiConsumer.consumer, apiConsumer.description, apiConsumer.isAuthorized, apiConsumer.createdAt.toISOString(),
        apiConsumer.expirationDate.toISOString(), apiConsumer.contact.emails, apiConsumer.contact.firstName, apiConsumer.contact.lastName, apiConsumer.contact.job,
        apiConsumer.contact.phone,
      ],
    );
  }

  #rawPgToApiConsumer(raw: PgApiConsumer): ApiConsumer {
    return apiConsumerSchema.parse({
      id: raw.id,
      consumer: raw.consumer,
      description: optional(raw.description),
      isAuthorized: raw.is_authorized,
      createdAt: raw.created_at,
      expirationDate: raw.expiration_date,
      contact: {
        firstName: raw.contact_first_name,
        lastName: raw.contact_last_name,
        job: raw.contact_job,
        emails: raw.contact_emails,
        phone: raw.contact_phone,
      },
    } satisfies ApiConsumer);
  }
}

type PgApiConsumer = {
  id: string;
  consumer: string;
  description?: string;
  is_authorized: boolean;
  created_at: Date;
  expiration_date: Date;
  contact_first_name: string;
  contact_last_name: string;
  contact_job: string;
  contact_emails: string[];
  contact_phone: string;
};
