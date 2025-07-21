import type { InsertObject } from "kysely";
import { sql } from "kysely";
import { keys } from "ramda";
import {
  type CandidateWarnedMethod,
  type CommonDiscussionDto,
  type ContactMode,
  type DataWithPagination,
  type DiscussionDto,
  type DiscussionId,
  type DiscussionInList,
  type DiscussionOrderKey,
  type DiscussionStatus,
  type EstablishmentRole,
  type Exchange,
  errors,
  type PotentialBeneficiaryCommonProps,
  pipeWithValue,
  type RejectionKind,
  type SiretDto,
  type WithDiscussionStatus,
} from "shared";
import { match, P } from "ts-pattern";
import {
  jsonBuildObject,
  jsonStripNulls,
  type KyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import type { Database } from "../../../config/pg/kysely/model/database";
import type {
  DiscussionRepository,
  GetDiscussionsParams,
  GetPaginatedDiscussionsForUserParams,
  HasDiscussionMatchingParams,
} from "../ports/DiscussionRepository";

const orderColumnByOrderKey: Record<
  DiscussionOrderKey,
  `discussions.${keyof Database["discussions"]}`
> = {
  createdAt: "discussions.created_at",
};

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
    const results = await executeGetDiscussions(this.transaction, {
      filters: {},
      limit: 1,
      id: discussionId,
    });

    return makeDiscussionDtoFromPgDiscussion(results).at(0);
  }

  public async getDiscussions(
    params: GetDiscussionsParams,
  ): Promise<DiscussionDto[]> {
    return executeGetDiscussions(this.transaction, params).then((results) =>
      makeDiscussionDtoFromPgDiscussion(results),
    );
  }

  public async getPaginatedDiscussionsForUser({
    pagination,
    filters,
    userId,
    order,
  }: GetPaginatedDiscussionsForUserParams): Promise<
    DataWithPagination<DiscussionInList>
  > {
    const authorizedRoles: EstablishmentRole[] = [
      "establishment-admin",
      "establishment-contact",
    ];
    const builder = pipeWithValue(
      this.transaction
        .selectFrom("establishments__users as eu")
        .innerJoin("discussions", "eu.siret", "discussions.siret")
        .innerJoin("exchanges", "discussions.id", "exchanges.discussion_id")
        .innerJoin(
          "public_appellations_data as pad",
          "discussions.appellation_code",
          "pad.ogr_appellation",
        )
        .innerJoin("public_romes_data as prd", "pad.code_rome", "prd.code_rome")
        .where("eu.user_id", "=", userId)
        .where("eu.role", "in", authorizedRoles),
      (b) => {
        if (!filters?.statuses || filters.statuses.length === 0) return b;
        return b.where("discussions.status", "in", filters.statuses);
      },
      (b) => {
        if (!filters?.search) return b;
        return b.where((eb) =>
          eb.or([
            eb("discussions.siret", "ilike", `%${filters.search}%`),
            eb("discussions.business_name", "ilike", `%${filters.search}%`),
            eb(
              "discussions.potential_beneficiary_first_name",
              "ilike",
              `%${filters.search}%`,
            ),
            eb(
              "discussions.potential_beneficiary_last_name",
              "ilike",
              `%${filters.search}%`,
            ),
            eb("pad.libelle_appellation_long", "ilike", `%${filters.search}%`),
            eb(
              sql`CAST(discussions.immersion_objective AS text)`, // immersion objective is ImmersionObjectives, not a string
              "ilike",
              `%${filters.search}%`,
            ),
          ]),
        );
      },
    );

    const page = pagination.page;
    const limit = pagination.perPage;
    const offset = (page - 1) * limit;

    const addPagination = (b: typeof builder) => b.limit(limit).offset(offset);
    const addOrder = (b: typeof builder) =>
      b.orderBy(orderColumnByOrderKey[order.by], order.direction);

    const groupByAndSelectAttributes = (b: typeof builder) =>
      b
        .groupBy([
          "discussions.id",
          "discussions.created_at",
          "discussions.siret",
          "discussions.kind",
          "discussions.status",
          "discussions.immersion_objective",
          "discussions.business_name",
          "discussions.potential_beneficiary_first_name",
          "discussions.potential_beneficiary_last_name",
          "discussions.potential_beneficiary_phone",
          "pad.ogr_appellation",
          "pad.libelle_appellation_long",
          "prd.code_rome",
          "prd.libelle_rome",
        ])
        .select(({ ref, fn }) => [
          "discussions.id as id",
          jsonBuildObject({
            romeCode: ref("prd.code_rome"),
            romeLabel: ref("prd.libelle_rome"),
            appellationCode: sql<string>`CAST(${ref("pad.ogr_appellation")} AS text)`,
            appellationLabel: ref("pad.libelle_appellation_long"),
          }).as("appellation"),
          "business_name as businessName",
          sql<string>`TO_CHAR(${ref("created_at")}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.as(
            "createdAt",
          ),
          "discussions.city as city",
          "discussions.siret as siret",
          "discussions.kind as kind",
          "discussions.status as status",
          "immersion_objective as immersionObjective",
          jsonBuildObject({
            firstName: ref("potential_beneficiary_first_name"),
            lastName: ref("potential_beneficiary_last_name"),
            phone: ref("potential_beneficiary_phone"),
          }).as("potentialBeneficiary"),
          fn
            .jsonAgg(
              jsonBuildObject({
                subject: ref("exchanges.subject"),
                message: ref("exchanges.message"),
                recipient: ref("exchanges.recipient"),
                sender: ref("exchanges.sender"),
                sentAt: sql<string>`TO_CHAR(${ref("exchanges.sent_at")}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
                attachments: ref("exchanges.attachments"),
              }),
            )
            .as("exchanges"),
        ]);

    const [data, totalCount] = await Promise.all([
      pipeWithValue(
        builder,
        addPagination,
        addOrder,
        groupByAndSelectAttributes,
      ).execute(),
      builder
        .select(({ fn }) => [fn.count("discussions.id").distinct().as("count")])
        .executeTakeFirstOrThrow()
        .then((result) => Number(result.count)),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      pagination: {
        totalRecords: totalCount,
        currentPage: page,
        totalPages,
        numberPerPage: limit,
      },
    };
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

  public async getObsoleteDiscussions(params: {
    olderThan: Date;
  }): Promise<DiscussionId[]> {
    const obsoleteDiscussions = await this.transaction
      .selectFrom("discussions")
      .select("discussions.id")
      .leftJoin("exchanges", "discussions.id", "exchanges.discussion_id")
      .where("created_at", "<=", params.olderThan)
      .where("status", "=", "PENDING")
      .having((eb) => eb.fn.count("exchanges.id"), "=", 1)
      .orderBy("created_at", "asc")
      .groupBy(["discussions.id", "discussions.created_at"])
      .execute();

    return obsoleteDiscussions.map((d) => d.id);
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
  discussion: GetDiscussionsResults[number]["discussion"],
): WithDiscussionStatus => {
  return match(discussion)
    .with({ status: "PENDING" }, ({ status }) => ({ status }))
    .with({ status: "REJECTED", rejectionKind: P.nullish }, (discussion) => {
      throw new Error(
        `Missing rejectionKind for rejected discussion ${discussion.id}`,
      );
    })
    .with(
      {
        status: "REJECTED",
        rejectionKind: "CANDIDATE_ALREADY_WARNED",
        candidateWarnedMethod: P.nullish,
      },
      (discussion) => {
        throw new Error(
          `Missing candidateWarnedMethod for CANDIDATE_ALREADY_WARNED rejection in discussion ${discussion.id}`,
        );
      },
    )
    .with(
      {
        status: "REJECTED",
        rejectionKind: "CANDIDATE_ALREADY_WARNED",
        candidateWarnedMethod: P.not(P.nullish),
      },
      ({ candidateWarnedMethod, status, rejectionKind }) => ({
        status,
        rejectionKind,
        candidateWarnedMethod,
      }),
    )
    .with(
      {
        status: "REJECTED",
        rejectionKind: "OTHER",
        rejectionReason: P.nullish,
      },
      (discussion) => {
        throw new Error(
          `Missing rejectionReason for OTHER rejection in discussion ${discussion.id}`,
        );
      },
    )
    .with(
      {
        status: "REJECTED",
        rejectionKind: "OTHER",
        rejectionReason: P.not(P.nullish),
      },
      ({ rejectionReason, status, rejectionKind, candidateWarnedMethod }) => ({
        status,
        rejectionKind,
        rejectionReason,
        candidateWarnedMethod,
      }),
    )
    .with(
      {
        status: "REJECTED",
        rejectionKind: P.union("UNABLE_TO_HELP", "NO_TIME", "DEPRECATED"),
      },
      ({ status, rejectionKind, candidateWarnedMethod }) => ({
        status,
        rejectionKind,
        candidateWarnedMethod,
      }),
    )
    .with({ status: "ACCEPTED" }, (discussion) => ({
      status: discussion.status,
      candidateWarnedMethod: discussion.candidateWarnedMethod ?? null,
    }))
    .exhaustive();
};

const makeDiscussionDtoFromPgDiscussion = (
  results: GetDiscussionsResults,
): DiscussionDto[] =>
  results.map(({ discussion }): DiscussionDto => {
    const common: CommonDiscussionDto = {
      address: discussion.address,
      businessName: discussion.businessName,
      createdAt: new Date(discussion.createdAt).toISOString(),
      exchanges: (discussion.exchanges ?? []).map(({ sentAt, ...rest }) => ({
        ...rest,
        sentAt: new Date(sentAt).toISOString(),
      })),
      siret: discussion.siret,
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
          appellationCode: discussion.appellationCode,
          establishmentContact: discussion.establishmentContact,
          acquisitionCampaign: discussion.acquisition_campaign,
          acquisitionKeyword: discussion.acquisition_keyword,
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
        appellationCode: discussion.appellationCode,
        establishmentContact: discussion.establishmentContact,
        acquisitionCampaign: discussion.acquisition_campaign,
        acquisitionKeyword: discussion.acquisition_keyword,
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
        appellationCode: discussion.appellationCode,
        establishmentContact: discussion.establishmentContact,
        acquisitionCampaign: discussion.acquisition_campaign,
        acquisitionKeyword: discussion.acquisition_keyword,
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
      appellationCode: discussion.appellationCode,
      establishmentContact: discussion.establishmentContact,
      acquisitionCampaign: discussion.acquisition_campaign,
      acquisitionKeyword: discussion.acquisition_keyword,
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
      rejection_kind: discussionStatusWithRejection.rejectionKind,
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

type GetDiscussionsResults = Awaited<ReturnType<typeof executeGetDiscussions>>;
const executeGetDiscussions = (
  transaction: KyselyDb,
  {
    filters: {
      createdSince,
      answeredByEstablishment,
      createdBetween,
      sirets,
      status,
      contactMode,
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
          (qb) =>
            contactMode
              ? qb.where("discussions.contact_method", "=", contactMode)
              : qb,
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
