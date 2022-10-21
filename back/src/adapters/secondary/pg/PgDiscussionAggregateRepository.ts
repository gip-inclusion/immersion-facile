import { PoolClient } from "pg";
import {
  DiscussionId,
  DiscussionAggregate,
} from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { DiscussionAggregateRepository } from "../../../domain/immersionOffer/ports/DiscussionAggregateRepository";

export class PgDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(private client: PoolClient) {}

  async insertDiscussionAggregate(discussion: DiscussionAggregate) {
    await this.client.query(
      `INSERT INTO discussions (
         id, contact_mode, siret, rome_code,
         potential_beneficiary_first_name,
         potential_beneficiary_last_name, potential_beneficiary_email, created_at 
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        discussion.id,
        discussion.contactMode,
        discussion.siret,
        discussion.romeCode,
        discussion.potentialBeneficiaryFirstName,
        discussion.potentialBeneficiaryLastName,
        discussion.potentialBeneficiaryEmail,
        discussion.createdAt.toISOString(),
      ],
    );
    await Promise.all(
      discussion.exchanges.map((exchange) =>
        this.client.query(
          `
      INSERT INTO exchanges (
        discussion_id, message, sender, recipient, sent_at
      ) VALUES ($1, $2, $3, $4, $5)`,
          [
            discussion.id,
            exchange.message,
            exchange.sender,
            exchange.recipient,
            exchange.sentAt.toISOString(),
          ],
        ),
      ),
    );
  }

  async retrieveDiscussionAggregate(
    discussionId: DiscussionId,
  ): Promise<DiscussionAggregate | undefined> {
    const pgResult = await this.client.query(
      `
    WITH exchanges_by_id AS (
      SELECT discussion_id, 
      ARRAY_AGG(JSON_BUILD_OBJECT('message', message, 'recipient', recipient, 'sender', sender, 'sentAt', sent_at) ) AS exchanges
      FROM exchanges 
      GROUP BY discussion_id
    )
    SELECT 
      JSON_BUILD_OBJECT(
        'id', id, 
        'contactMode', contact_mode, 
        'siret', siret,
        'romeCode', rome_code, 
        'potentialBeneficiaryFirstName',  potential_beneficiary_first_name,
        'potentialBeneficiaryLastName',  potential_beneficiary_last_name,
        'potentialBeneficiaryEmail',  potential_beneficiary_email,
        'createdAt', created_at,
        'exchanges', exchanges
    ) AS discussion
    FROM discussions 
    LEFT JOIN exchanges_by_id ON exchanges_by_id.discussion_id = discussions.id
    WHERE id = $1
    `,
      [discussionId],
    );
    const discussion: DiscussionAggregate = pgResult.rows[0]?.discussion;
    if (!discussion) return;
    return {
      ...discussion,
      createdAt: new Date(discussion.createdAt),
      exchanges: discussion.exchanges.map((exchange) => ({
        ...exchange,
        sentAt: new Date(exchange.sentAt),
      })),
    };
  }
}
