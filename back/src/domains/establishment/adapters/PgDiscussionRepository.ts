import type { InsertObject } from "kysely";
import { sql } from "kysely";
import { keys } from "ramda";
import {
  type CandidateWarnedMethod,
  type CommonDiscussionDto,
  type ContactMode,
  type DiscussionDto,
  type DiscussionId,
  type DiscussionStatus,
  type Exchange,
  type PotentialBeneficiaryCommonProps,
  type RejectionKind,
  type SiretDto,
  type WithDiscussionStatus,
  errors,
  pipeWithValue,
} from "shared";
import {
  type KyselyDb,
  jsonBuildObject,
  jsonStripNulls,
} from "../../../config/pg/kysely/kyselyUtils";
import type { Database } from "../../../config/pg/kysely/model/database";
import type {
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

    return result ? Number.parseInt(result.count) : 0;
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
    const results = await executeGetDiscussion(this.transaction, {
      filters: {},
      limit: 1,
      id: discussionId,
    });

    return makeDiscussionDtoFromPgDiscussion(results).at(0);
  }

  public async getDiscussions(
    params: GetDiscussionsParams,
  ): Promise<DiscussionDto[]> {
    return executeGetDiscussion(this.transaction, params).then((results) =>
      makeDiscussionDtoFromPgDiscussion(results),
    );
  }

  public async hasDiscussionMatching(
    params: Partial<HasDiscussionMatchingParams>,
  ): Promise<boolean> {
    if (keys(params).length === 0)
      throw errors.discussion.hasDiscussionMissingParams();
    const result = await this.transaction
      .selectNoFrom(({ exists, selectFrom, lit }) => [
        exists(
          pipeWithValue(
            selectFrom("discussions").select(lit(1).as("one")),
            (builder) =>
              params.siret
                ? builder.where("siret", "=", params.siret)
                : builder,
            (builder) =>
              params.appellationCode
                ? builder.where(
                    "appellation_code",
                    "=",
                    +params.appellationCode,
                  )
                : builder,
            (builder) =>
              params.since
                ? builder.where("created_at", ">=", params.since)
                : builder,
            (builder) =>
              params.potentialBeneficiaryEmail
                ? builder.where(
                    "potential_beneficiary_email",
                    "=",
                    params.potentialBeneficiaryEmail,
                  )
                : builder,
            (builder) => {
              const establishmentRepresentativeEmail =
                params.establishmentRepresentativeEmail;
              return establishmentRepresentativeEmail
                ? builder.where(({ eb, or }) =>
                    or([
                      eb(
                        "establishment_contact_email",
                        "=",
                        establishmentRepresentativeEmail,
                      ),
                      eb(
                        "establishment_contact_copy_emails",
                        "?",
                        establishmentRepresentativeEmail,
                      ),
                    ]),
                  )
                : builder;
            },
          ),
        ).as("exists"),
      ])
      .executeTakeFirst();

    return !!result?.exists;
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
  postcode: discussion.address.postcode,
  potential_beneficiary_email: discussion.potentialBeneficiary.email,
  potential_beneficiary_last_name: discussion.potentialBeneficiary.lastName,
  kind: discussion.kind,
  ...(discussion.contactMode === "EMAIL"
    ? {
        immersion_objective: discussion.potentialBeneficiary.immersionObjective,
        potential_beneficiary_phone: discussion.potentialBeneficiary.phone,
        potential_beneficiary_date_preferences:
          discussion.potentialBeneficiary.datePreferences,
        ...(discussion.kind === "IF"
          ? {
              potential_beneficiary_resume_link:
                discussion.potentialBeneficiary.resumeLink,
              potential_beneficiary_experience_additional_information:
                discussion.potentialBeneficiary.experienceAdditionalInformation,
              potential_beneficiary_has_working_experience:
                discussion.potentialBeneficiary.hasWorkingExperience ===
                undefined
                  ? null
                  : discussion.potentialBeneficiary.hasWorkingExperience,
            }
          : {}),
      }
    : {}),
  potential_beneficiary_level_of_education:
    discussion.kind === "1_ELEVE_1_STAGE"
      ? discussion.potentialBeneficiary.levelOfEducation
      : null,
  street_number_and_address: discussion.address.streetNumberAndAddress,
  siret: discussion.siret,
  contact_method: discussion.contactMode,
  potential_beneficiary_first_name: discussion.potentialBeneficiary.firstName,
  acquisition_campaign: discussion.acquisitionCampaign,
  acquisition_keyword: discussion.acquisitionKeyword,
  convention_id: discussion.conventionId,
  ...discussionStatusWithRejectionToPg(discussion),
});

const getWithDiscussionStatusFromPgDiscussion = (
  discussion: GetDiscussionResults[number]["discussion"],
): WithDiscussionStatus =>
  ({
    status: discussion.status,
    rejectionKind: discussion.rejectionKind,
    rejectionReason: discussion.rejectionReason,
    ...(discussion.status === "PENDING"
      ? {}
      : {
          candidateWarnedMethod: discussion.candidateWarnedMethod ?? null,
        }),
  }) as WithDiscussionStatus;

const makeDiscussionDtoFromPgDiscussion = (
  results: GetDiscussionResults,
): DiscussionDto[] =>
  results.map(({ discussion }): DiscussionDto => {
    const common: CommonDiscussionDto = {
      address: discussion.address,
      appellationCode: discussion.appellationCode,
      businessName: discussion.businessName,
      createdAt: new Date(discussion.createdAt).toISOString(),
      establishmentContact: discussion.establishmentContact,
      exchanges: (discussion.exchanges ?? []).map(({ sentAt, ...rest }) => ({
        ...rest,
        sentAt: new Date(sentAt).toISOString(),
      })),
      siret: discussion.siret,
      acquisitionCampaign: discussion.acquisition_campaign,
      acquisitionKeyword: discussion.acquisition_keyword,
      conventionId: discussion.conventionId,
      id: discussion.id,
      ...getWithDiscussionStatusFromPgDiscussion(discussion),
    };

    const commonPotentialBeneficiary: PotentialBeneficiaryCommonProps = {
      firstName: discussion.potentialBeneficiary.firstName,
      lastName: discussion.potentialBeneficiary.lastName,
      email: discussion.potentialBeneficiary.email,
    };

    if (discussion.contactMode === "EMAIL") {
      const phone = discussion.potentialBeneficiary.phone;
      const datePreferences = discussion.potentialBeneficiary.datePreferences;

      if (phone === undefined)
        throw errors.discussion.missingPhone(discussion.id);
      if (datePreferences === undefined)
        throw errors.discussion.missingDatePreferences(discussion.id);

      if (discussion.kind === "IF") {
        return {
          ...common,
          contactMode: discussion.contactMode,
          kind: discussion.kind,
          potentialBeneficiary: {
            ...commonPotentialBeneficiary,
            phone,
            immersionObjective: discussion.immersionObjective ?? null,
            datePreferences,
            hasWorkingExperience:
              discussion.potentialBeneficiary.hasWorkingExperience,
            resumeLink: discussion.potentialBeneficiary.resumeLink,
            experienceAdditionalInformation:
              discussion.potentialBeneficiary.experienceAdditionalInformation,
          },
        };
      }

      if (
        discussion.immersionObjective !==
        "Découvrir un métier ou un secteur d'activité"
      )
        throw errors.discussion.badImmersionObjective(
          discussion.id,
          discussion.kind,
          discussion.immersionObjective,
        );
      if (!discussion.potentialBeneficiary.levelOfEducation)
        throw errors.discussion.missingLevelOfEducation({
          id: discussion.id,
          kind: discussion.kind,
        });
      return {
        ...common,
        contactMode: discussion.contactMode,
        kind: discussion.kind,
        potentialBeneficiary: {
          ...commonPotentialBeneficiary,
          phone,
          immersionObjective: discussion.immersionObjective,
          datePreferences,
          levelOfEducation: discussion.potentialBeneficiary.levelOfEducation,
        },
      };
    }
    if (discussion.kind === "1_ELEVE_1_STAGE") {
      if (!discussion.potentialBeneficiary.levelOfEducation)
        throw new Error(
          `Missing level of education for discussion kind ${discussion.kind}`,
        );

      return {
        ...common,
        contactMode: discussion.contactMode,
        kind: discussion.kind,
        potentialBeneficiary: {
          ...commonPotentialBeneficiary,
          levelOfEducation: discussion.potentialBeneficiary.levelOfEducation,
        },
      };
    }

    return {
      ...common,
      contactMode: discussion.contactMode,
      kind: discussion.kind,
      potentialBeneficiary: commonPotentialBeneficiary,
    };
  });

const discussionStatusWithRejectionToPg = (
  discussionStatusWithRejection: WithDiscussionStatus,
): {
  status: DiscussionStatus;
  rejection_kind: RejectionKind | null;
  rejection_reason: string | null;
  candidate_warned_method: CandidateWarnedMethod | null;
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
      candidate_warned_method:
        discussionStatusWithRejection.rejectionKind ===
        "CANDIDATE_ALREADY_WARNED"
          ? discussionStatusWithRejection.candidateWarnedMethod
          : null,
    };
  }

  return {
    status: status,
    rejection_kind: null,
    rejection_reason: null,
    candidate_warned_method:
      status === "PENDING"
        ? null
        : discussionStatusWithRejection.candidateWarnedMethod,
  };
};

type GetDiscussionResults = Awaited<ReturnType<typeof executeGetDiscussion>>;
const executeGetDiscussion = (
  transaction: KyselyDb,
  {
    filters: {
      createdSince,
      answeredByEstablishment,
      createdBetween,
      sirets,
      status,
    },
    id,
    limit,
  }: GetDiscussionsParams & { id?: DiscussionId },
) =>
  transaction
    .selectFrom("discussions as d")
    .innerJoin(
      (qb) =>
        pipeWithValue(
          qb.selectFrom("discussions").select("discussions.id"),
          (qb) => (status ? qb.where("discussions.status", "=", status) : qb),
          (qb) => (id ? qb.where("discussions.id", "=", id) : qb),
          (qb) => {
            if (!sirets) return qb;
            if (sirets.length === 0) throw errors.discussion.badSiretFilter();
            return qb.where(
              "discussions.siret",
              "=",
              sql<SiretDto>`ANY(${sirets})`,
            );
          },
          (qb) =>
            createdSince
              ? qb.where("discussions.created_at", ">=", createdSince)
              : qb,
          (qb) =>
            createdBetween
              ? qb.where((qb) =>
                  qb.between(
                    qb.ref("discussions.created_at"),
                    createdBetween.from,
                    createdBetween.to,
                  ),
                )
              : qb,
          (qb) =>
            answeredByEstablishment !== undefined
              ? qb.where(({ not, exists, selectFrom, lit }) => {
                  const existSubQuery = exists(
                    selectFrom("exchanges")
                      .select(lit(1).as("one"))
                      .whereRef(
                        "exchanges.discussion_id",
                        "=",
                        "discussions.id",
                      )
                      .where("exchanges.sender", "=", "establishment"),
                  );
                  return answeredByEstablishment
                    ? existSubQuery
                    : not(existSubQuery);
                })
              : qb,
        )
          .limit(limit)
          .as("filtered_discussions"),
      (join) => join.onRef("d.id", "=", "filtered_discussions.id"),
    )
    .leftJoin("exchanges as e", "d.id", "e.discussion_id")
    .groupBy(["d.id", "d.created_at", "d.siret"])
    .orderBy("d.created_at", "desc")
    .orderBy("d.siret", "asc")
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
          contactMode: sql<ContactMode>`${ref("d.contact_method")}`,
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
            levelOfEducation: ref("d.potential_beneficiary_level_of_education"),
          }),
          establishmentContact: jsonBuildObject({
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
              sql`
                JSON_BUILD_OBJECT(
                  'subject', e.subject,
                  'message', e.message,
                  'recipient', e.recipient,
                  'sender', e.sender,
                  'sentAt', e.sent_at,
                  'attachments', e.attachments
                )
                ORDER BY e.sent_at
              `.$castTo<Exchange>(),
            )
            .filterWhere("e.id", "is not", null)
            // TODO: le cast ne change pas le typage - trouver un moyen d'avoir l'optional[] dans le typage kysely naturel
            .$castTo<Exchange[] | undefined>(),
          conventionId: ref("d.convention_id"),
          status: sql<DiscussionStatus>`${ref("d.status")}`,
          rejectionKind: sql<RejectionKind | null>`${ref("d.rejection_kind")}`,
          rejectionReason: ref("d.rejection_reason"),
          acquisition_campaign: ref("d.acquisition_campaign"),
          acquisition_keyword: ref("d.acquisition_keyword"),
          candidateWarnedMethod: ref("d.candidate_warned_method"),
          kind: ref("d.kind"),
        }),
      ).as("discussion"),
    )
    .execute();
