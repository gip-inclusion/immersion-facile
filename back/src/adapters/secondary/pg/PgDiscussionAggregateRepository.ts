import { Kysely, sql } from "kysely";
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
import { ImmersionDatabase } from "./sql/database";

const logger = createLogger(__filename);

export class PgDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  private async clearAllExistingExchanges(discussion: DiscussionAggregate) {
    await sql`
        DELETE
        FROM exchanges
        WHERE discussion_id = ${discussion.id}
    `.execute(this.transaction);
  }

  async countDiscussionsForSiretSince(
    siret: SiretDto,
    since: Date,
  ): Promise<number> {
    const result = await sql<{ count: string }>`
        SELECT COUNT(*)
        FROM discussions
        WHERE siret = ${siret}
          AND created_at >= ${since}
    `.execute(this.transaction);

    const row = result.rows.at(0);
    return row ? parseInt(row.count) : 0;
  }

  public async getById(
    discussionId: DiscussionId,
  ): Promise<DiscussionAggregate | undefined> {
    const result = await sql<{
      discussion: DiscussionAggregate;
    }>`WITH exchanges_by_id AS (SELECT discussion_id,
                                       ARRAY_AGG(
                                               JSON_BUILD_OBJECT(
                                                       'message', message,
                                                       'recipient', recipient,
                                                       'sender', sender,
                                                       'sentAt', sent_at,
                                                       'subject', subject
                                                   )) AS exchanges
                                FROM exchanges
                                GROUP BY discussion_id)
       SELECT JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
               'id', id,
               'createdAt', created_at,
               'siret', siret,
               'businessName', business_name,
               'appellationCode', appellation_code::text,
               'immersionObjective', immersion_objective,
               'potentialBeneficiary', JSON_BUILD_OBJECT(
                       'firstName', potential_beneficiary_first_name,
                       'lastName', potential_beneficiary_last_name,
                       'email', potential_beneficiary_email,
                       'phone', potential_beneficiary_phone,
                       'resumeLink', potential_beneficiary_resume_link
                   ),
               'establishmentContact', JSON_BUILD_OBJECT(
                       'contactMethod', contact_method,
                       'firstName', establishment_contact_first_name,
                       'lastName', establishment_contact_last_name,
                       'email', establishment_contact_email,
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
       WHERE id = ${discussionId}`.execute(this.transaction);

    const discussion = result.rows.at(0)?.discussion;

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
    const result = await sql<{ exists: boolean }>`
        SELECT EXISTS (SELECT 1
                       FROM discussions
                       WHERE siret = ${siret}
                         AND appellation_code = ${appellationCode}
                         AND potential_beneficiary_email = ${potentialBeneficiaryEmail}
                         AND created_at >= ${since})`.execute(this.transaction);

    const row = result.rows.at(0);

    return row ? row.exists : false;
  }

  async insert(discussion: DiscussionAggregate) {
    logger.info({ ...discussion }, "PgDiscussionAggregateRepository_Insert");
    await this.insertDiscussion(discussion);
    await this.insertAllExchanges(discussion.id, discussion.exchanges);
  }

  private async insertAllExchanges(
    discussionId: DiscussionId,
    exchanges: ExchangeEntity[],
  ): Promise<void> {
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
      ({message, recipient, sender, sentAt, subject}) =>
        [discussionId, message, sender, recipient, sentAt.toISOString(), subject],
    );

    await sql.raw(`${format(query, values)}`).execute(this.transaction);
  }

  private async insertDiscussion(
    discussion: DiscussionAggregate,
  ): Promise<void> {
    await this.transaction
      .insertInto("discussions")
      .values({
        id: discussion.id,
        contact_method: discussion.establishmentContact.contactMethod,
        siret: discussion.siret,
        appellation_code: parseInt(discussion.appellationCode),
        potential_beneficiary_first_name:
          discussion.potentialBeneficiary.firstName,
        potential_beneficiary_last_name:
          discussion.potentialBeneficiary.lastName,
        potential_beneficiary_email: discussion.potentialBeneficiary.email,
        potential_beneficiary_phone: discussion.potentialBeneficiary.phone,
        immersion_objective: discussion.immersionObjective,
        potential_beneficiary_resume_link:
          discussion.potentialBeneficiary.resumeLink,
        created_at: discussion.createdAt,
        establishment_contact_email: discussion.establishmentContact.email,
        establishment_contact_first_name:
          discussion.establishmentContact.firstName,
        establishment_contact_last_name:
          discussion.establishmentContact.lastName,
        establishment_contact_phone: discussion.establishmentContact.phone,
        establishment_contact_job: discussion.establishmentContact.job,
        establishment_contact_copy_emails: JSON.stringify(
          discussion.establishmentContact.copyEmails,
        ),
        street_number_and_address: discussion.address.streetNumberAndAddress,
        postcode: discussion.address.postcode,
        department_code: discussion.address.departmentCode,
        city: discussion.address.city,
        business_name: discussion.businessName,
      })
      .execute();
  }

  public async update(discussion: DiscussionAggregate) {
    logger.info({ ...discussion }, "PgDiscussionAggregateRepository_Update");
    await this.updateDiscussion(discussion);
    await this.clearAllExistingExchanges(discussion);
    await this.insertAllExchanges(discussion.id, discussion.exchanges);
  }

  private async updateDiscussion(
    discussion: DiscussionAggregate,
  ): Promise<void> {
    await sql`
        UPDATE discussions
        SET contact_method                    = ${
          discussion.establishmentContact.contactMethod
        },
            siret                             = ${discussion.siret},
            appellation_code                  = ${discussion.appellationCode},
            potential_beneficiary_first_name  = ${
              discussion.potentialBeneficiary.firstName
            },
            potential_beneficiary_last_name   = ${
              discussion.potentialBeneficiary.lastName
            },
            potential_beneficiary_email       = ${
              discussion.potentialBeneficiary.email
            },
            potential_beneficiary_phone       = ${
              discussion.potentialBeneficiary.phone
            },
            immersion_objective               = ${
              discussion.immersionObjective
            },
            potential_beneficiary_resume_link = ${
              discussion.potentialBeneficiary.resumeLink
            },
            created_at                        = ${discussion.createdAt.toISOString()},
            establishment_contact_email       = ${
              discussion.establishmentContact.email
            },
            establishment_contact_first_name  = ${
              discussion.establishmentContact.firstName
            },
            establishment_contact_last_name   = ${
              discussion.establishmentContact.lastName
            },
            establishment_contact_phone       = ${
              discussion.establishmentContact.phone
            },
            establishment_contact_job         = ${
              discussion.establishmentContact.job
            },
            establishment_contact_copy_emails = ${JSON.stringify(
              discussion.establishmentContact.copyEmails,
            )},
            street_number_and_address         = ${
              discussion.address.streetNumberAndAddress
            },
            postcode                          = ${discussion.address.postcode},
            department_code                   = ${
              discussion.address.departmentCode
            },
            city                              = ${discussion.address.city},
            business_name                     = ${discussion.businessName}
        WHERE id = ${discussion.id}`.execute(this.transaction);
  }
}
