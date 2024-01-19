import type { InsertObject } from "kysely";
import { sql } from "kysely";
import { ContactMethod, DiscussionId, SiretDto } from "shared";
import {
  DiscussionAggregate,
  ExchangeEntity,
} from "../../../../domain/offer/entities/DiscussionAggregate";
import {
  DiscussionAggregateRepository,
  HasDiscussionMatchingParams,
} from "../../../../domain/offer/ports/DiscussionAggregateRepository";
import {
  jsonBuildObject,
  jsonStripNulls,
  KyselyDb,
} from "../kysely/kyselyUtils";
import { Database } from "../kysely/model/database";

export class PgDiscussionAggregateRepository
  implements DiscussionAggregateRepository
{
  constructor(private transaction: KyselyDb) {}

  public async countDiscussionsForSiretSince(
    siret: SiretDto,
    since: Date,
  ): Promise<number> {
    const result = await this.transaction
      .selectFrom("discussions")
      .select(({ fn }) => [fn.count<string>("id").as("count")])
      .where("siret", "=", siret)
      .where("created_at", ">=", since)
      .executeTakeFirst();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return parseInt(result!.count);
  }

  public async deleteOldMessages(endedSince: Date) {
    const result = await this.transaction
      .updateTable("exchanges")
      .set({
        message: "Supprimé car trop ancien",
      })
      .where("sent_at", "<=", endedSince)
      .executeTakeFirst();

    return Number(result.numUpdatedRows);
  }

  public async getById(
    discussionId: DiscussionId,
  ): Promise<DiscussionAggregate | undefined> {
    const pgResult = await this.transaction
      .with("exchanges_by_id", (db) =>
        db
          .selectFrom("exchanges")
          .where("discussion_id", "=", discussionId)
          .groupBy("discussion_id")
          .select(({ ref, fn }) => [
            "discussion_id",
            fn
              .agg<ExchangeEntity[]>("array_agg", [
                jsonBuildObject({
                  subject: ref("subject"),
                  message: ref("message"),
                  recipient: ref("recipient"),
                  sender: ref("sender"),
                  sentAt: ref("sent_at"),
                }),
              ])
              .as("exchanges"),
          ]),
      )
      .selectFrom("discussions")
      .leftJoin("exchanges_by_id", "discussion_id", "id")
      .where("id", "=", discussionId)
      .select((qb) => [
        jsonStripNulls(
          jsonBuildObject({
            id: qb.ref("id"),
            createdAt: qb.ref("created_at"),
            siret: qb.ref("siret"),
            businessName: qb.ref("business_name"),
            appellationCode: sql<string>`CAST(${qb.ref(
              "appellation_code",
            )} AS text)`,
            immersionObjective: qb.ref("immersion_objective"),
            potentialBeneficiary: jsonBuildObject({
              firstName: qb.ref("potential_beneficiary_first_name"),
              lastName: qb.ref("potential_beneficiary_last_name"),
              email: qb.ref("potential_beneficiary_email"),
              phone: qb.ref("potential_beneficiary_phone"),
              resumeLink: qb.ref("potential_beneficiary_resume_link"),
            }),
            establishmentContact: jsonBuildObject({
              contactMethod: sql<ContactMethod>`${qb.ref("contact_method")}`,
              firstName: qb.ref("establishment_contact_first_name"),
              lastName: qb.ref("establishment_contact_last_name"),
              email: qb.ref("establishment_contact_email"),
              phone: qb.ref("establishment_contact_phone"),
              job: qb.ref("establishment_contact_job"),
              copyEmails: sql<string[]>`${qb.ref(
                "establishment_contact_copy_emails",
              )}`,
            }),
            address: jsonBuildObject({
              streetNumberAndAddress: qb.ref("street_number_and_address"),
              postcode: qb.ref("postcode"),
              departmentCode: qb.ref("department_code"),
              city: qb.ref("city"),
            }),
            exchanges: qb.ref("exchanges"),
          }),
        ).as("discussion"),
      ])
      .executeTakeFirst();

    if (!pgResult) return;
    const { discussion } = pgResult;

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
    const result = await this.transaction
      .selectFrom("discussions")
      .select(({ exists, selectFrom, lit }) => [
        exists(
          selectFrom("discussions")
            .select(lit(1).as("one"))
            .where("siret", "=", siret)
            .where("appellation_code", "=", +appellationCode)
            .where(
              "potential_beneficiary_email",
              "=",
              potentialBeneficiaryEmail,
            )
            .where("created_at", ">=", since),
        ).as("exists"),
      ])
      .execute();

    return !!result.at(0)?.exists;
  }

  public async insert(discussion: DiscussionAggregate) {
    await this.transaction
      .insertInto("discussions")
      .values(discussionAggregateToPg(discussion))
      .execute();

    await this.#insertAllExchanges(discussion.id, discussion.exchanges);
  }

  public async update(discussion: DiscussionAggregate) {
    await this.transaction
      .updateTable("discussions")
      .set(discussionAggregateToPg(discussion))
      .where("id", "=", discussion.id)
      .execute();
    await this.#clearAllExistingExchanges(discussion);
    await this.#insertAllExchanges(discussion.id, discussion.exchanges);
  }

  async #insertAllExchanges(
    discussionId: DiscussionId,
    exchanges: ExchangeEntity[],
  ) {
    if (exchanges.length === 0) return;

    await this.transaction
      .insertInto("exchanges")
      .values(
        exchanges.map((exchange) => ({
          subject: exchange.subject,
          discussion_id: discussionId,
          message: exchange.message,
          sender: exchange.sender,
          recipient: exchange.recipient,
          sent_at: exchange.sentAt.toISOString(),
        })),
      )
      .execute();
  }

  async #clearAllExistingExchanges(discussion: DiscussionAggregate) {
    await this.transaction
      .deleteFrom("exchanges")
      .where("discussion_id", "=", discussion.id)
      .execute();
  }
}

const discussionAggregateToPg = (
  discussion: DiscussionAggregate,
): InsertObject<Database, "discussions"> => ({
  id: discussion.id,
  appellation_code: +discussion.appellationCode,
  business_name: discussion.businessName,
  city: discussion.address.city,
  created_at: discussion.createdAt,
  department_code: discussion.address.departmentCode,
  establishment_contact_copy_emails: JSON.stringify(
    discussion.establishmentContact.copyEmails,
  ),
  establishment_contact_email: discussion.establishmentContact.email,
  establishment_contact_first_name: discussion.establishmentContact.firstName,
  establishment_contact_job: discussion.establishmentContact.job,
  establishment_contact_last_name: discussion.establishmentContact.lastName,
  establishment_contact_phone: discussion.establishmentContact.phone,
  immersion_objective: discussion.immersionObjective,
  postcode: discussion.address.postcode,
  potential_beneficiary_email: discussion.potentialBeneficiary.email,
  potential_beneficiary_last_name: discussion.potentialBeneficiary.lastName,
  potential_beneficiary_phone: discussion.potentialBeneficiary.phone,
  potential_beneficiary_resume_link: discussion.potentialBeneficiary.resumeLink,
  street_number_and_address: discussion.address.streetNumberAndAddress,
  siret: discussion.siret,
  contact_method: discussion.establishmentContact.contactMethod,
  potential_beneficiary_first_name: discussion.potentialBeneficiary.firstName,
});
