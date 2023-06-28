import { PoolClient } from "pg";
import format from "pg-format";
import { SiretDto } from "shared";
import {
  DiscussionAggregate,
  DiscussionId,
  ExchangeEntity,
} from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { DiscussionAggregateRepository } from "../../../domain/immersionOffer/ports/DiscussionAggregateRepository";

export class PgDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(private client: PoolClient) {}

  async insert(discussion: DiscussionAggregate) {
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
         created_at,
         establishment_contact_email,
         establishment_contact_first_name,
         establishment_contact_last_name,
         establishment_contact_phone,
         establishment_contact_job,
         establishment_contact_copy_emails,
         street_number_and_address,
         postcode,
         department_code,
         city
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
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
        discussion.establishmentContact.email,
        discussion.establishmentContact.firstName,
        discussion.establishmentContact.lastName,
        discussion.establishmentContact.phone,
        discussion.establishmentContact.job,
        JSON.stringify(discussion.establishmentContact.copyEmails),
        discussion.address.streetNumberAndAddress,
        discussion.address.postcode,
        discussion.address.departmentCode,
        discussion.address.city,
      ],
    );

    await this.insertAllExchanges(discussion.id, discussion.exchanges);
  }

  async update(discussion: DiscussionAggregate) {
    await this.client.query(
      `UPDATE discussions SET
         contact_mode = $1,
         siret = $2,
         appellation_code = $3,
         potential_beneficiary_first_name = $4,
         potential_beneficiary_last_name = $5,
         potential_beneficiary_email = $6,
         potential_beneficiary_phone = $7,
         immersion_objective = $8,
         potential_beneficiary_resume_link = $9,
         created_at = $10,
         establishment_contact_email = $11,
         establishment_contact_first_name = $12,
         establishment_contact_last_name = $13,
         establishment_contact_phone = $14,
         establishment_contact_job = $15,
         establishment_contact_copy_emails = $16,
         street_number_and_address = $17,
         postcode = $18,
         department_code = $19,
         city = $20
       WHERE id = $21`,
      [
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
        discussion.establishmentContact.email,
        discussion.establishmentContact.firstName,
        discussion.establishmentContact.lastName,
        discussion.establishmentContact.phone,
        discussion.establishmentContact.job,
        JSON.stringify(discussion.establishmentContact.copyEmails),
        discussion.address.streetNumberAndAddress,
        discussion.address.postcode,
        discussion.address.departmentCode,
        discussion.address.city,
        discussion.id,
      ],
    );

    await this.clearAllExistingExchanges(discussion);
    await this.insertAllExchanges(discussion.id, discussion.exchanges);
  }

  async getById(
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
          'contactMode', contact_mode,
          'firstName',  establishment_contact_first_name,
          'lastName',  establishment_contact_last_name,
          'email',  establishment_contact_email,
          'phone', establishment_contact_phone,
          'job', establishment_contact_job,
          'copyEmails', establishment_contact_copy_emails
        ),
        'address', JSON_BUILD_OBJECT(
          'streetNumberAndAddress', street_number_and_address,
          'postcode', postcode,
          'departmentCode', department_code,
          'city', city
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
      immersionObjective: discussion.immersionObjective ?? null,
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

  private async insertAllExchanges(
    discussionId: DiscussionId,
    exchanges: ExchangeEntity[],
  ) {
    const sql = format(
      `
    INSERT INTO exchanges (discussion_id, message, sender, recipient, sent_at)
    VALUES %L
    `,
      exchanges.map((exchange) => [
        discussionId,
        exchange.message,
        exchange.sender,
        exchange.recipient,
        exchange.sentAt.toISOString(),
      ]),
    );

    await this.client.query(sql);
  }

  private async clearAllExistingExchanges(discussion: DiscussionAggregate) {
    await this.client.query("DELETE FROM exchanges WHERE discussion_id = $1", [
      discussion.id,
    ]);
  }
}
