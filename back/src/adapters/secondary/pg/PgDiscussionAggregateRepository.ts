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
        discussion.contactMode,
        discussion.siret,
        discussion.appellationCode,
        discussion.potentialBeneficiaryFirstName,
        discussion.potentialBeneficiaryLastName,
        discussion.potentialBeneficiaryEmail,
        discussion.potentialBeneficiaryPhone,
        discussion.immersionObjective,
        discussion.potentialBeneficiaryResumeLink,
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
        'appellationCode', appellation_code, 
        'potentialBeneficiaryFirstName',  potential_beneficiary_first_name,
        'potentialBeneficiaryLastName',  potential_beneficiary_last_name,
        'potentialBeneficiaryEmail',  potential_beneficiary_email,
        'immersionObjective', immersion_objective ,
        'potentialBeneficiaryPhone', potential_beneficiary_phone ,
        'potentialBeneficiaryResumeLink', potential_beneficiary_resume_link ,
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
