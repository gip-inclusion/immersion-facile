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
      .where("d.id", "=", discussionId)
      .executeTakeFirst();

    return pgResult
      ? this.#makeDiscussionDtoFromPgDiscussion(pgResult.discussion)
      : undefined;
  }

  public async getDiscussions({
    filters: { createdSince, lastAnsweredByCandidate, sirets },
    limit,
  }: GetDiscussionsParams): Promise<DiscussionDto[]> {
    const results = await pipeWithValue(
      this.#makeDiscussionQueryBuilder(),
      (b) => (createdSince ? b.where("d.created_at", ">=", createdSince) : b),
      (b) =>
        sirets && sirets?.length > 0 ? b.where("d.siret", "in", sirets) : b,
      (b) =>
        lastAnsweredByCandidate
          ? b.where("d.id", "in", (qb) =>
              qb
                .selectFrom("exchanges")
                .select("discussion_id")
                .where("sender", "=", "potentialBeneficiary")
                .where(
                  qb.between(
                    "e.sent_at",
                    lastAnsweredByCandidate.from,
                    lastAnsweredByCandidate.to,
                  ),
                )
                .whereRef("d.id", "=", "exchanges.discussion_id"),
            )
          : b,
    )
      .orderBy("d.created_at", "desc")
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
      .selectFrom("discussions as d")
      .leftJoin("exchanges as e", "d.id", "e.discussion_id")
      .groupBy(["d.id", "d.created_at", "d.siret"])
      .select(({ ref, fn }) =>
        jsonStripNulls(
          jsonBuildObject({
            id: ref("d.id"),
            createdAt: ref("d.created_at"),
            siret: ref("d.siret"),
            businessName: ref("d.business_name"),
            appellationCode: sql<string>`CAST(${ref(
              "appellation_code",
            )} AS text)`,
            immersionObjective: ref("d.immersion_objective"),
            potentialBeneficiary: jsonBuildObject({
              firstName: ref("d.potential_beneficiary_first_name"),
              lastName: ref("d.potential_beneficiary_last_name"),
              email: ref("d.potential_beneficiary_email"),
              phone: ref("d.potential_beneficiary_phone"),
              resumeLink: ref("d.potential_beneficiary_resume_link"),
              hasWorkingExperience: ref(
                "potential_beneficiary_has_working_experience",
              ),
              experienceAdditionalInformation: ref(
                "potential_beneficiary_experience_additional_information",
              ),
              datePreferences: ref("d.potential_beneficiary_date_preferences"),
            }),
            establishmentContact: jsonBuildObject({
              contactMethod: sql<ContactMethod>`${ref("d.contact_method")}`,
              firstName: ref("d.establishment_contact_first_name"),
              lastName: ref("d.establishment_contact_last_name"),
              email: ref("d.establishment_contact_email"),
              phone: ref("d.establishment_contact_phone"),
              job: ref("d.establishment_contact_job"),
              copyEmails: sql<string[]>`${ref(
                "establishment_contact_copy_emails",
              )}`,
            }),
            address: jsonBuildObject({
              streetNumberAndAddress: ref("d.street_number_and_address"),
              postcode: ref("d.postcode"),
              departmentCode: ref("d.department_code"),
              city: ref("d.city"),
            }),
            exchanges: fn
              .jsonAgg(
                jsonBuildObject({
                  subject: ref("e.subject"),
                  message: ref("e.message"),
                  recipient: ref("e.recipient"),
                  sender: ref("e.sender"),
                  sentAt: ref("e.sent_at"),
                  attachments: ref("e.attachments"),
                }).$castTo<Exchange>(),
              )
              .filterWhere("e.id", "is not", null),
            conventionId: ref("d.convention_id"),
            status: sql<DiscussionStatus>`${ref("d.status")}`,
            rejectionKind: sql<RejectionKind>`${ref("d.rejection_kind")}`,
            rejectionReason: ref("d.rejection_reason"),
          }),
        ).as("discussion"),
      );
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
    potential_beneficiary_experience_additional_information:
      discussion.potentialBeneficiary.experienceAdditionalInformation,
    potential_beneficiary_has_working_experience:
      discussion.potentialBeneficiary.hasWorkingExperience,
    potential_beneficiary_date_preferences:
      discussion.potentialBeneficiary.datePreferences,
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
): DiscussionStatusWithRejection => {
  return discussion.status === "REJECTED"
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
        status: discussion.status,
      };
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
