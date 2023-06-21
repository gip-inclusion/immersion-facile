import { PoolClient } from "pg";
import { SiretDto } from "shared";
import {
  DiscussionAggregate,
  DiscussionId,
} from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { DiscussionAggregateRepository } from "../../../domain/immersionOffer/ports/DiscussionAggregateRepository";

export class PgDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(private client: PoolClient) {}

  async insertDiscussionAggregate(discussion: DiscussionAggregate) {
    await this.client.query(
      `INSERT INTO discussions (
         id, 
         contact_mode, 
         siret, 
         appellation_code,
         potential_beneficiary_first_name,
         potential_beneficiary_last_name, 
         potential_beneficiary_email, 
         potential_beneficiary_phone,
         immersion_objective,
         potential_beneficiary_resume_link, 
         created_at 
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        discussion.id,
        discussion.establishmentContact.contactMode,
        discussion.siret,
        discussion.appellationCode,
        discussion.potentialBeneficiary.firstName,
        discussion.potentialBeneficiary.lastName,
        discussion.potentialBeneficiary.email,
        discussion.potentialBeneficiary.phone,
        discussion.immersionObjective,
        discussion.potentialBeneficiary.resumeLink,
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
      JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
        'id', id, 
        'createdAt', created_at,
        'siret', siret,
        'appellationCode', appellation_code::text,
        'immersionObjective', immersion_objective,
        'potentialBeneficiary', JSON_BUILD_OBJECT(
          'firstName',  potential_beneficiary_first_name,
          'lastName',  potential_beneficiary_last_name,
          'email',  potential_beneficiary_email,
          'phone', potential_beneficiary_phone,
          'resumeLink', potential_beneficiary_resume_link
        ),
        'establishmentContact', JSON_BUILD_OBJECT(
          'contactMode', contact_mode
        ),
        'exchanges', exchanges
    )) AS discussion
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

  async countDiscussionsForSiretSince(
    siret: SiretDto,
    since: Date,
  ): Promise<number> {
    const pgResult = await this.client.query(
      `SELECT COUNT(*) 
      FROM discussions
      WHERE siret = $1 AND created_at >= $2`,
      [siret, since],
    );

    return parseInt(pgResult.rows[0].count);
  }
}
