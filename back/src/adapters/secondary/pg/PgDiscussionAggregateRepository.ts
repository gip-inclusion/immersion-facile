import { PoolClient, QueryConfig, QueryResult, QueryResultRow } from "pg";
import format from "pg-format";
import { DiscussionId, SiretDto } from "shared";
import {
  DiscussionAggregate,
  ExchangeEntity,
} from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import {
  DiscussionAggregateRepository,
  HasDiscussionMatchingParams,
} from "../../../domain/immersionOffer/ports/DiscussionAggregateRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class PgDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(private client: PoolClient) {}

  private async clearAllExistingExchanges(discussion: DiscussionAggregate) {
    const query = "DELETE FROM exchanges WHERE discussion_id = $1";
    const values = [discussion.id];
    await this.executeQuery("clearAllExistingExchanges", query, values);
  }

  async countDiscussionsForSiretSince(
    siret: SiretDto,
    since: Date,
  ): Promise<number> {
    const query = `SELECT COUNT(*) 
      FROM discussions
      WHERE siret = $1 AND created_at >= $2`;
    const values = [siret, since];
    const pgResult = await this.executeQuery(
      "countDiscussionsForSiretSince",
      query,
      values,
    );
    return parseInt(pgResult.rows[0].count);
  }

  private executeQuery<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryName: string,
    queryTextOrConfig: string | QueryConfig<I>,
    values?: I,
  ): Promise<QueryResult<R>> {
    return this.client.query(queryTextOrConfig, values).catch((error) => {
      logger.error(
        { query: queryTextOrConfig, values, error },
        `PgDiscussionAggregateRepository_${queryName}_queryErrored`,
      );
      throw error;
    });
  }

  async getById(
    discussionId: DiscussionId,
  ): Promise<DiscussionAggregate | undefined> {
    const query = `
    WITH exchanges_by_id AS (
      SELECT discussion_id, 
      ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'message', message,
          'recipient', recipient,
          'sender', sender,
          'sentAt', sent_at,
          'subject', subject
        ) ) AS exchanges
      FROM exchanges 
      GROUP BY discussion_id
    )
    SELECT 
      JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
        'id', id, 
        'createdAt', created_at,
        'siret', siret,
        'businessName', business_name,
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
          'contactMethod', contact_method,
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
    `;
    const values = [discussionId];
    const pgResult = await this.executeQuery("getById", query, values);
    const discussion = pgResult.rows.at(0)?.discussion;
    return (
      discussion && {
        ...discussion,
        createdAt: new Date(discussion.createdAt),
        immersionObjective: discussion.immersionObjective ?? null,
        exchanges: discussion.exchanges
          ? discussion.exchanges.map(({ sentAt, ...rest }: ExchangeEntity) => ({
              sentAt: new Date(sentAt),
              ...rest,
            }))
          : [],
      }
    );
  }

  public async hasDiscussionMatching({
    siret,
    appellationCode,
    potentialBeneficiaryEmail,
    since,
  }: HasDiscussionMatchingParams): Promise<boolean> {
    const result = await this.client.query(
      `
        SELECT EXISTS (SELECT 1 FROM discussions 
            WHERE siret = $1
                AND appellation_code = $2
                AND potential_beneficiary_email = $3
                AND created_at >= $4)`,
      [siret, appellationCode, potentialBeneficiaryEmail, since.toISOString()],
    );

    return result.rows[0].exists;
  }

  async insert(discussion: DiscussionAggregate) {
    logger.info({ ...discussion }, "PgDiscussionAggregateRepository_Insert");
    const query = `INSERT INTO discussions ( 
      id, contact_method, siret, appellation_code, potential_beneficiary_first_name, 
      potential_beneficiary_last_name, potential_beneficiary_email, potential_beneficiary_phone, immersion_objective, potential_beneficiary_resume_link, 
      created_at, establishment_contact_email, establishment_contact_first_name, establishment_contact_last_name, establishment_contact_phone, 
      establishment_contact_job, establishment_contact_copy_emails, street_number_and_address, postcode, department_code, 
      city, business_name
    ) VALUES (
      $1, $2, $3, $4, $5, 
      $6, $7, $8, $9, $10, 
      $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, 
      $21, $22
    )`;
    // prettier-ignore
    const values = [ discussion.id, discussion.establishmentContact.contactMethod, discussion.siret, discussion.appellationCode, discussion.potentialBeneficiary.firstName, discussion.potentialBeneficiary.lastName, discussion.potentialBeneficiary.email, discussion.potentialBeneficiary.phone, discussion.immersionObjective, discussion.potentialBeneficiary.resumeLink, discussion.createdAt.toISOString(), discussion.establishmentContact.email, discussion.establishmentContact.firstName, discussion.establishmentContact.lastName, discussion.establishmentContact.phone, discussion.establishmentContact.job, JSON.stringify(discussion.establishmentContact.copyEmails), discussion.address.streetNumberAndAddress, discussion.address.postcode, discussion.address.departmentCode, discussion.address.city, discussion.businessName, ];
    await this.executeQuery("insert", query, values);
    await this.insertAllExchanges(discussion.id, discussion.exchanges);
  }

  private async insertAllExchanges(
    discussionId: DiscussionId,
    exchanges: ExchangeEntity[],
  ) {
    if (exchanges.length === 0) {
      logger.info(
        { discussionId },
        "PgDiscussionAggregateRepository_insertAllExchanges_SkipNoExchanges",
      );
      return;
    }
    const query = `
    INSERT INTO exchanges (discussion_id, message, sender, recipient, sent_at, subject)
    VALUES %L
    `;
    // prettier-ignore
    const values = exchanges.map(
      ({ message, recipient, sender, sentAt, subject }) =>
      [ discussionId, message, sender, recipient, sentAt.toISOString(), subject],
    );
    await this.executeQuery("insertAllExchanges", format(query, values));
  }

  public async update(discussion: DiscussionAggregate) {
    logger.info({ ...discussion }, "PgDiscussionAggregateRepository_Update");
    const query = `
    UPDATE discussions SET
      contact_method = $1, siret = $2, appellation_code = $3, potential_beneficiary_first_name = $4, potential_beneficiary_last_name = $5,
      potential_beneficiary_email = $6, potential_beneficiary_phone = $7, immersion_objective = $8, potential_beneficiary_resume_link = $9, created_at = $10,
      establishment_contact_email = $11, establishment_contact_first_name = $12, establishment_contact_last_name = $13, establishment_contact_phone = $14, establishment_contact_job = $15,
      establishment_contact_copy_emails = $16, street_number_and_address = $17, postcode = $18, department_code = $19, city = $20,
      business_name = $22
    WHERE id = $21`;
    // prettier-ignore
    const values = [
      discussion.establishmentContact.contactMethod, discussion.siret, discussion.appellationCode, discussion.potentialBeneficiary.firstName, discussion.potentialBeneficiary.lastName,
      discussion.potentialBeneficiary.email, discussion.potentialBeneficiary.phone, discussion.immersionObjective, discussion.potentialBeneficiary.resumeLink, discussion.createdAt.toISOString(),
      discussion.establishmentContact.email, discussion.establishmentContact.firstName, discussion.establishmentContact.lastName, discussion.establishmentContact.phone, discussion.establishmentContact.job,
      JSON.stringify(discussion.establishmentContact.copyEmails), discussion.address.streetNumberAndAddress, discussion.address.postcode, discussion.address.departmentCode, discussion.address.city,
      discussion.id,
      discussion.businessName,
    ];
    await this.executeQuery("update", query, values);
    await this.clearAllExistingExchanges(discussion);
    await this.insertAllExchanges(discussion.id, discussion.exchanges);
  }
}
