import type { InsertObject } from "kysely";
import { sql } from "kysely";
import {
  ContactMethod,
  DiscussionDto,
  DiscussionId,
  DiscussionStatus,
  DiscussionStatusWithRejection,
  Exchange,
  RejectionKind,
  SiretDto,
  pipeWithValue,
} from "shared";
import {
  KyselyDb,
  jsonBuildObject,
  jsonStripNulls,
} from "../../../config/pg/kysely/kyselyUtils";
import { Database } from "../../../config/pg/kysely/model/database";
import {
  DiscussionRepository,
  GetDiscussionsParams,
  HasDiscussionMatchingParams,
} from "../ports/DiscussionRepository";

export class PgDiscussionRepository implements DiscussionRepository {
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

    return result ? parseInt(result.count) : 0;
  }

  public async deleteOldMessages(endedSince: Date) {
    const result = await this.transaction
      .updateTable("exchanges")
      .set({
        message: "Supprimé car trop ancien",
        attachments: sql`CAST(${JSON.stringify([])} AS JSONB)`,
      })
      .where("sent_at", "<=", endedSince)
      .executeTakeFirst();

    return Number(result.numUpdatedRows);
  }

  public async getById(
    discussionId: DiscussionId,
  ): Promise<DiscussionDto | undefined> {
    const pgResult = await this.#makeDiscussionQueryBuilder()
      .where("discussions.id", "=", discussionId)
      .executeTakeFirst();

    return pgResult
      ? this.#makeDiscussionDtoFromPgDiscussion(pgResult.discussion)
      : undefined;
  }

  public async getDiscussions(
    { createdSince, lastAnsweredByCandidate, sirets }: GetDiscussionsParams,
    limit: number,
  ): Promise<DiscussionDto[]> {
    const results = await pipeWithValue(
      this.#makeDiscussionQueryBuilder(),
      (b) =>
        createdSince
          ? b.where("discussions.created_at", ">=", createdSince)
          : b,
      (b) =>
        sirets && sirets?.length > 0
          ? b.where("discussions.siret", "in", sirets)
          : b,
      (b) =>
        lastAnsweredByCandidate
          ? b
              .where("last_exchanges.sender", "=", "potentialBeneficiary")
              .where((eb) =>
                eb.between(
                  "last_exchanges.sent_at",
                  lastAnsweredByCandidate.from,
                  lastAnsweredByCandidate.to,
                ),
              )
          : b,
    )
      .orderBy("discussions.created_at", "desc")
      .limit(limit)
      .execute();

    return results.map(({ discussion }) =>
      this.#makeDiscussionDtoFromPgDiscussion(discussion),
    );
  }

  #makeDiscussionDtoFromPgDiscussion(discussion: PgDiscussion): DiscussionDto {
    return (
      discussion && {
        ...discussion,
        createdAt: new Date(discussion.createdAt).toISOString(),
        immersionObjective: discussion.immersionObjective ?? null,
        exchanges: discussion.exchanges
          ? discussion.exchanges.map((exchange) => ({
              ...exchange,
              sentAt: new Date(exchange.sentAt).toISOString(),
            }))
          : [],
        ...makeDiscussionStatusAndRejection(discussion),
      }
    );
  }

  #makeDiscussionQueryBuilder() {
    return this.transaction
      .with("last_exchanges", (db) =>
        db
          .selectFrom(({ selectFrom }) =>
            selectFrom("exchanges")
              .select(({ fn }) => [
                "discussion_id",
                "sent_at",
                "sender",
                fn
                  .agg<number>("rank")
                  .over((ob) =>
                    ob.partitionBy("discussion_id").orderBy("sent_at", "desc"),
                  )
                  .as("rn"),
              ])
              .as("sub"),
          )
          .select(["discussion_id", "sent_at", "sender"])
          .where("rn", "=", 1),
      )
      .with("exchanges_by_id", (db) =>
        db
          .selectFrom("exchanges")
          .groupBy("discussion_id")
          .select(({ ref, fn }) => [
            "discussion_id",
            fn
              .agg<Exchange[]>("array_agg", [
                jsonBuildObject({
                  subject: ref("subject"),
                  message: ref("message"),
                  recipient: ref("recipient"),
                  sender: ref("sender"),
                  sentAt: ref("sent_at"),
                  attachments: ref("attachments"),
                }),
              ])
              .as("exchanges"),
          ]),
      )
      .selectFrom("discussions")
      .leftJoin("exchanges_by_id", "discussion_id", "id")
      .leftJoin(
        "last_exchanges",
        "last_exchanges.discussion_id",
        "discussions.id",
      )
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
            conventionId: qb.ref("convention_id"),
            status: sql<DiscussionStatus>`${qb.ref("status")}`,
            rejectionKind: sql<RejectionKind>`${qb.ref("rejection_kind")}`,
            rejectionReason: qb.ref("rejection_reason"),
          }),
        ).as("discussion"),
      ]);
  }

  public async hasDiscussionMatching({
    siret,
    appellationCode,
    potentialBeneficiaryEmail,
    since,
    establishmentRepresentativeEmail,
  }: Partial<HasDiscussionMatchingParams>): Promise<boolean> {
    const result = await this.transaction
      .selectFrom("discussions")
      .select(({ exists, selectFrom, lit, fn }) => [
        exists(
          pipeWithValue(
            selectFrom("discussions").select(lit(1).as("one")),
            (builder) => (siret ? builder.where("siret", "=", siret) : builder),
            (builder) =>
              appellationCode
                ? builder.where("appellation_code", "=", +appellationCode)
                : builder,
            (builder) =>
              since ? builder.where("created_at", ">=", since) : builder,
            (builder) =>
              potentialBeneficiaryEmail
                ? builder.where(
                    fn("lower", ["potential_beneficiary_email"]),
                    "=",
                    potentialBeneficiaryEmail.toLowerCase(),
                  )
                : builder,
            (builder) =>
              establishmentRepresentativeEmail
                ? builder.where(
                    fn("lower", ["establishment_contact_email"]),
                    "=",
                    establishmentRepresentativeEmail.toLowerCase(),
                  )
                : builder,
          ),
        ).as("exists"),
      ])
      .execute();

    return !!result.at(0)?.exists;
  }

  public async insert(discussion: DiscussionDto) {
    await this.transaction
      .insertInto("discussions")
      .values(discussionToPg(discussion))
      .execute();

    await this.#insertAllExchanges(discussion.id, discussion.exchanges);
  }

  public async update(discussion: DiscussionDto) {
    await this.transaction
      .updateTable("discussions")
      .set(discussionToPg(discussion))
      .where("id", "=", discussion.id)
      .execute();
    await this.#clearAllExistingExchanges(discussion);
    await this.#insertAllExchanges(discussion.id, discussion.exchanges);
  }

  async #insertAllExchanges(discussionId: DiscussionId, exchanges: Exchange[]) {
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
          sent_at: exchange.sentAt,
          attachments: sql`CAST(${JSON.stringify(
            exchange.attachments,
          )} AS JSONB)`,
        })),
      )
      .execute();
  }

  async #clearAllExistingExchanges(discussion: DiscussionDto) {
    await this.transaction
      .deleteFrom("exchanges")
      .where("discussion_id", "=", discussion.id)
      .execute();
  }
}

const discussionToPg = (
  discussion: DiscussionDto,
): InsertObject<Database, "discussions"> => {
  return {
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
    potential_beneficiary_resume_link:
      discussion.potentialBeneficiary.resumeLink,
    street_number_and_address: discussion.address.streetNumberAndAddress,
    siret: discussion.siret,
    contact_method: discussion.establishmentContact.contactMethod,
    potential_beneficiary_first_name: discussion.potentialBeneficiary.firstName,
    acquisition_campaign: discussion.acquisitionCampaign,
    acquisition_keyword: discussion.acquisitionKeyword,
    convention_id: discussion.conventionId,
    ...discussionStatusWithRejectionToPg(
      makeDiscussionStatusAndRejection(discussion),
    ),
  };
};

const makeDiscussionStatusAndRejection = (
  discussion: DiscussionDto | PgDiscussion,
): DiscussionStatusWithRejection =>
  discussion.status === "REJECTED"
    ? {
        status: "REJECTED",
        ...(discussion.rejectionKind === "OTHER"
          ? {
              rejectionKind: "OTHER",
              rejectionReason: discussion.rejectionReason ?? "",
            }
          : {
              rejectionKind: discussion.rejectionKind ?? "UNABLE_TO_HELP",
            }),
      }
    : {
        status: "PENDING",
      };

const discussionStatusWithRejectionToPg = (
  discussionStatusWithRejection: DiscussionStatusWithRejection,
): {
  status: DiscussionStatus;
  rejection_kind: RejectionKind | null;
  rejection_reason: string | null;
} => {
  const { status } = discussionStatusWithRejection;
  if (status === "REJECTED") {
    return {
      status: status,
      rejection_kind:
        discussionStatusWithRejection.rejectionKind === "OTHER"
          ? "OTHER"
          : "UNABLE_TO_HELP",
      rejection_reason:
        discussionStatusWithRejection.rejectionKind === "OTHER"
          ? discussionStatusWithRejection.rejectionReason
          : null,
    };
  }
  return {
    status: status,
    rejection_kind: null,
    rejection_reason: null,
  };
};

type PgDiscussion = {
  id: string;
  createdAt: Date;
  siret: string;
  businessName: string;
  appellationCode: string;
  immersionObjective:
    | "Confirmer un projet professionnel"
    | "Découvrir un métier ou un secteur d'activité"
    | "Initier une démarche de recrutement"
    | undefined;
  potentialBeneficiary: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | undefined;
    resumeLink: string | undefined;
  };
  establishmentContact: {
    contactMethod: "EMAIL" | "PHONE" | "IN_PERSON";
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    job: string;
    copyEmails: string[];
  };
  address: {
    streetNumberAndAddress: string;
    postcode: string;
    departmentCode: string;
    city: string;
  };
  exchanges: Exchange[] | undefined;
  status: DiscussionStatus;
  rejectionKind: Exclude<RejectionKind, null> | undefined;
  rejectionReason: string | undefined;
};
