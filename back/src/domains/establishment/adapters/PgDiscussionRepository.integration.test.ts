import { addDays, addHours, subDays } from "date-fns";
import type { Pool } from "pg";
import {
  type AppellationAndRomeDto,
  DiscussionBuilder,
  type DiscussionDto,
  type DiscussionEstablishmentContact,
  type DiscussionInList,
  type Exchange,
  type ImmersionObjective,
  UserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  EstablishmentAggregateBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import type { HasDiscussionMatchingParams } from "../ports/DiscussionRepository";
import { PgDiscussionRepository } from "./PgDiscussionRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";

describe("PgDiscussionRepository", () => {
  const styliste: AppellationAndRomeDto = {
    romeCode: "B1805",
    romeLabel: "Stylisme",
    appellationCode: "19540",
    appellationLabel: "Styliste",
  };

  const offer = new OfferEntityBuilder()
    .withRomeCode(styliste.romeCode)
    .withAppellationCode(styliste.appellationCode)
    .withAppellationLabel(styliste.appellationLabel)
    .build();

  const establishmentContactWithoutFirstNameAndLastName: DiscussionEstablishmentContact =
    {
      email: "test@test.com",
      phone: "0123456789",
      job: "test",
      copyEmails: [],
    };

  const date = new Date("2023-07-07");

  let pool: Pool;
  let pgDiscussionRepository: PgDiscussionRepository;
  let establishmentAggregateRepo: PgEstablishmentAggregateRepository;
  let db: KyselyDb;

  const user = new UserBuilder().withId(new UuidV4Generator().new()).build();

  beforeAll(async () => {
    pool = getTestPgPool();
  });

  beforeEach(async () => {
    db = makeKyselyDb(pool);
    await db.deleteFrom("establishments__users").execute();
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("discussions").execute();
    await db.deleteFrom("exchanges").execute();
    await db.deleteFrom("users").execute();
    pgDiscussionRepository = new PgDiscussionRepository(db);
    establishmentAggregateRepo = new PgEstablishmentAggregateRepository(db);

    await new PgUserRepository(db).save(user);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getDiscussions", () => {
    describe("unit filter param", () => {
      describe("siret filter param", () => {
        const discussionWithSiret1 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-01"))
          .withSiret("00000000000001")
          .withPotentialBeneficiaryHasWorkingExperience(false)
          .build();
        const discussionWithSiret2 = new DiscussionBuilder(discussionWithSiret1)
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-02"))
          .withEstablishmentContact(
            establishmentContactWithoutFirstNameAndLastName,
          )
          .build();
        const discussionWithoutSiret = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-03"))
          .withSiret("00000000000002")
          .build();
        beforeEach(async () => {
          await pgDiscussionRepository.insert(discussionWithSiret1);
          await pgDiscussionRepository.insert(discussionWithSiret2);
          await pgDiscussionRepository.insert(discussionWithoutSiret);
        });

        it("exclude discussion that do not have siret in filter", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                sirets: [discussionWithSiret1.siret],
              },
              limit: 5,
            }),
            [discussionWithSiret2, discussionWithSiret1],
          );
        });

        it("include all discussions that have sirets in filter", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                sirets: [
                  discussionWithSiret1.siret,
                  discussionWithoutSiret.siret,
                ],
              },
              limit: 5,
            }),
            [
              discussionWithoutSiret,
              discussionWithSiret2,
              discussionWithSiret1,
            ],
          );
        });

        it("exclude all discussions if siret in filter does not match any discussion siret", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                sirets: ["99999999999999"],
              },
              limit: 5,
            }),
            [],
          );
        });

        it("throws if siret filter is provided but empty", async () => {
          await expectPromiseToFailWithError(
            pgDiscussionRepository.getDiscussions({
              filters: {
                sirets: [],
              },
              limit: 5,
            }),
            errors.discussion.badSiretFilter(),
          );
        });
      });

      describe("createdSince filter param", () => {
        const discussionCreatedSince1 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-01"))
          .build();
        const discussionCreatedSince2 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-02"))
          .build();
        const discussionCreatedBefore = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2023-12-31"))
          .build();

        beforeEach(async () => {
          await pgDiscussionRepository.insert(discussionCreatedSince1);
          await pgDiscussionRepository.insert(discussionCreatedSince2);
          await pgDiscussionRepository.insert(discussionCreatedBefore);
        });

        it("exclude discussions created before", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdSince: new Date(discussionCreatedSince1.createdAt),
              },
              limit: 10,
            }),
            [discussionCreatedSince2, discussionCreatedSince1],
          );
        });
        it("include all discussions if created since date is the creation date of the oldest discussion", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdSince: new Date(discussionCreatedBefore.createdAt),
              },
              limit: 10,
            }),
            [
              discussionCreatedSince2,
              discussionCreatedSince1,
              discussionCreatedBefore,
            ],
          );
        });
        it("exclude all discussions if created since date is after of the most recent discussion", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdSince: new Date("2024-01-03"),
              },
              limit: 10,
            }),
            [],
          );
        });
      });

      describe("createdBetween filter param", () => {
        const discussionCreatedBefore = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-08-01 23:59:59"))
          .build();
        const discussionCreatedBetween1 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-08-02 00:00:00"))
          .build();
        const discussionCreatedBetween2 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-08-03 00:00:00"))
          .build();
        const discussionCreatedAfter = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-08-03 00:00:01"))
          .build();

        beforeEach(async () => {
          await pgDiscussionRepository.insert(discussionCreatedBefore);
          await pgDiscussionRepository.insert(discussionCreatedBetween1);
          await pgDiscussionRepository.insert(discussionCreatedBetween2);
          await pgDiscussionRepository.insert(discussionCreatedAfter);
        });

        it("include discussion with created at exactly of created between ranges", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdBetween: {
                  from: new Date("2024-08-02 00:00:00"),
                  to: new Date("2024-08-03 00:00:00"),
                },
              },
              limit: 5,
            }),
            [discussionCreatedBetween2, discussionCreatedBetween1],
          );
        });
        it("include discussion with created at very close of created between range", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdBetween: {
                  from: new Date("2024-08-01 23:59:59:999"),
                  to: new Date("2024-08-02 00:00:00:001"),
                },
              },
              limit: 5,
            }),
            [discussionCreatedBetween1],
          );
        });
        it("exclude all discussions with created between range out of discussions created at", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdBetween: {
                  from: new Date("2024-08-03 00:00:01:001"),
                  to: new Date("2024-08-04 00:00:00"),
                },
              },
              limit: 5,
            }),
            [],
          );
        });
      });

      describe("answeredByEstablishment filter param", () => {
        const discussionNotAnsweredByEstablishment = new DiscussionBuilder()
          .withId(uuid())
          .withExchanges([
            {
              sender: "potentialBeneficiary",
              recipient: "establishment",
              message: "",
              attachments: [],
              sentAt: new Date().toISOString(),
              subject: "",
            },
          ])
          .build();
        const discussionAnsweredByEstablishment = new DiscussionBuilder()
          .withId(uuid())
          .withExchanges([
            {
              sender: "establishment",
              recipient: "potentialBeneficiary",
              message: "",
              attachments: [],
              sentAt: new Date().toISOString(),
              subject: "",
            },
          ])
          .build();

        beforeEach(async () => {
          await pgDiscussionRepository.insert(
            discussionAnsweredByEstablishment,
          );
          await pgDiscussionRepository.insert(
            discussionNotAnsweredByEstablishment,
          );
        });

        it("include only discussions answered by establishment", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                answeredByEstablishment: true,
              },
              limit: 5,
            }),
            [discussionAnsweredByEstablishment],
          );
        });

        it("include only discussions not answered by establishment", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                answeredByEstablishment: false,
              },
              limit: 5,
            }),
            [discussionNotAnsweredByEstablishment],
          );
        });
      });
    });
    describe("combo filters", () => {
      it("exclude discussions that does not match filters", async () => {
        type ReducedExchange = Pick<Exchange, "sender" | "recipient">;
        const sendedByBeneficiary: ReducedExchange = {
          sender: "potentialBeneficiary",
          recipient: "establishment",
        };
        const sendedByEstablishment: ReducedExchange = {
          sender: "establishment",
          recipient: "potentialBeneficiary",
        };

        const date = new Date("2024-08-02 00:00:00");
        const discussionToMatchWithLotOfExchanges = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(date)
          .withStatus({ status: "PENDING" })
          .withExchanges(
            [
              sendedByBeneficiary,
              sendedByEstablishment,
              sendedByBeneficiary,
              sendedByBeneficiary,
              sendedByEstablishment,
              sendedByEstablishment,
              sendedByBeneficiary,
              sendedByBeneficiary,
              sendedByBeneficiary,
              sendedByBeneficiary,
              sendedByEstablishment,
            ].map((rest, index) => ({
              ...rest,
              message: "",
              subject: "",
              attachments: [],
              sentAt: addHours(new Date(date), index).toISOString(),
            })),
          )
          .build();
        const discussionToMatchWithOneExchangeOfEach = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withExchanges(
            [sendedByBeneficiary, sendedByEstablishment].map((rest, index) => ({
              ...rest,
              message: "",
              subject: "",
              attachments: [],
              sentAt: addHours(new Date(date), index).toISOString(),
            })),
          )
          .withCreatedAt(
            addHours(
              new Date(discussionToMatchWithLotOfExchanges.createdAt),
              1,
            ),
          )
          .build();
        const discussionBadSiret = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withSiret("99999999999999")
          .build();
        const discussionCreatedAtBelowRange = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withCreatedAt(subDays(new Date(discussionBadSiret.createdAt), 1))
          .build();
        const discussionCreatedAfterRange = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withCreatedAt(addDays(new Date(discussionBadSiret.createdAt), 1))
          .build();
        const discussionNotAnsweredByEstablishment = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withExchanges([
            {
              attachments: [],
              message: "",
              subject: "",
              sentAt: new Date().toISOString(),
              recipient: "establishment",
              sender: "potentialBeneficiary",
            },
          ])
          .build();

        await pgDiscussionRepository.insert(
          discussionToMatchWithLotOfExchanges,
        );
        await pgDiscussionRepository.insert(
          discussionToMatchWithOneExchangeOfEach,
        );
        await pgDiscussionRepository.insert(discussionBadSiret);
        await pgDiscussionRepository.insert(discussionCreatedAtBelowRange);
        await pgDiscussionRepository.insert(discussionCreatedAfterRange);
        await pgDiscussionRepository.insert(
          discussionNotAnsweredByEstablishment,
        );

        expectToEqual(
          await pgDiscussionRepository.getDiscussions({
            filters: {
              answeredByEstablishment: true,
              status: discussionToMatchWithLotOfExchanges.status,
              createdBetween: {
                from: new Date(discussionToMatchWithLotOfExchanges.createdAt),
                to: new Date(discussionToMatchWithOneExchangeOfEach.createdAt),
              },
              sirets: [discussionToMatchWithLotOfExchanges.siret],
              createdSince: new Date(
                discussionToMatchWithLotOfExchanges.createdAt,
              ),
            },
            limit: 5,
          }),
          [
            discussionToMatchWithOneExchangeOfEach,
            discussionToMatchWithLotOfExchanges,
          ],
        );
      });
    });
  });

  describe("getPaginatedDiscussionsForUser", () => {
    const discussion1 = new DiscussionBuilder()
      .withId(uuid())
      .withSiret("00000000000001")
      .withCreatedAt(new Date("2025-05-18"))
      .withStatus({ status: "PENDING" })
      .build();

    const discussion2Objective: ImmersionObjective =
      "Confirmer un projet professionnel";

    const potentialBeneficiaryPhone = "0606060606";
    const discussion2 = new DiscussionBuilder()
      .withId(uuid())
      .withSiret("00000000000002")
      .withPotentialBeneficiaryLastName("Smith")
      .withCreatedAt(new Date("2025-05-19"))
      .withAppellationCode(styliste.appellationCode)
      .withPotentialBeneficiaryPhone(potentialBeneficiaryPhone)
      .withImmersionObjective(discussion2Objective)
      .withStatus({ status: "ACCEPTED", candidateWarnedMethod: "phone" })
      .build();

    const discussion3Objective: ImmersionObjective =
      "Initier une démarche de recrutement";

    const discussion3 = new DiscussionBuilder()
      .withId(uuid())
      .withSiret("00000000000003")
      .withPotentialBeneficiaryFirstname("Mark")
      .withBusinessName("Something different")
      .withAppellationCode(styliste.appellationCode)
      .withPotentialBeneficiaryPhone(potentialBeneficiaryPhone)
      .withCreatedAt(new Date("2025-05-20"))
      .withImmersionObjective(discussion3Objective)
      .withStatus({ status: "REJECTED", rejectionKind: "UNABLE_TO_HELP" })
      .build();

    const discussion2InList: DiscussionInList = {
      id: discussion2.id,
      siret: discussion2.siret,
      status: discussion2.status,
      appellation: styliste,
      businessName: discussion2.businessName,
      createdAt: discussion2.createdAt,
      kind: discussion2.kind,
      potentialBeneficiary: {
        firstName: discussion2.potentialBeneficiary.firstName,
        lastName: discussion2.potentialBeneficiary.lastName,
        phone: potentialBeneficiaryPhone,
      },
      city: discussion2.address.city,
      immersionObjective: discussion2Objective,
      exchanges: discussion2.exchanges,
    };

    const discussion3InList: DiscussionInList = {
      id: discussion3.id,
      siret: discussion3.siret,
      status: discussion3.status,
      appellation: styliste,
      businessName: discussion3.businessName,
      createdAt: discussion3.createdAt,
      kind: discussion3.kind,
      potentialBeneficiary: {
        firstName: discussion3.potentialBeneficiary.firstName,
        lastName: discussion3.potentialBeneficiary.lastName,
        phone: potentialBeneficiaryPhone,
      },
      city: discussion3.address.city,
      immersionObjective: discussion3Objective,
      exchanges: discussion3.exchanges,
    };

    beforeEach(async () => {
      await pgDiscussionRepository.insert(discussion1);
      await pgDiscussionRepository.insert(discussion2);
      await pgDiscussionRepository.insert(discussion3);

      await establishmentAggregateRepo.insertEstablishmentAggregate(
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(discussion2.siret)
          .withUserRights([
            {
              role: "establishment-admin",
              userId: user.id,
              job: "",
              phone: "",
            },
          ])
          .withOffers([offer])
          .build(),
      );

      await establishmentAggregateRepo.insertEstablishmentAggregate(
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(discussion3.siret)
          .withLocationId(uuid())
          .withUserRights([
            {
              role: "establishment-admin",
              userId: user.id,
              job: "",
              phone: "",
            },
          ])
          .withOffers([offer])
          .build(),
      );
    });

    it("gets all conventions of a user without filters, and supports ordering by createdAt", async () => {
      const resultWithDefaultOrder =
        await pgDiscussionRepository.getPaginatedDiscussionsForUser({
          pagination: {
            page: 1,
            perPage: 10,
          },
          order: { by: "createdAt", direction: "desc" },
          userId: user.id,
        });

      expectToEqual(resultWithDefaultOrder, {
        data: [discussion3InList, discussion2InList],
        pagination: {
          currentPage: 1,
          numberPerPage: 10,
          totalPages: 1,
          totalRecords: 2,
        },
      });

      const resultWithAscOrder =
        await pgDiscussionRepository.getPaginatedDiscussionsForUser({
          pagination: {
            page: 1,
            perPage: 10,
          },
          order: { by: "createdAt", direction: "asc" },
          userId: user.id,
        });

      expectToEqual(resultWithAscOrder, {
        data: [discussion2InList, discussion3InList],
        pagination: {
          currentPage: 1,
          numberPerPage: 10,
          totalPages: 1,
          totalRecords: 2,
        },
      });
    });

    it("filters on statuses", async () => {
      const result =
        await pgDiscussionRepository.getPaginatedDiscussionsForUser({
          filters: {
            statuses: ["ACCEPTED"],
          },
          pagination: {
            page: 1,
            perPage: 10,
          },
          order: { by: "createdAt", direction: "desc" },
          userId: user.id,
        });

      expectToEqual(result, {
        data: [discussion2InList],
        pagination: {
          currentPage: 1,
          numberPerPage: 10,
          totalPages: 1,
          totalRecords: 1,
        },
      });
    });

    describe("search", () => {
      it("filters on sirets in search", async () => {
        const result =
          await pgDiscussionRepository.getPaginatedDiscussionsForUser({
            filters: {
              search: discussion3.siret.slice(-6), // last 6 digits of the siret (but would also work with the SIREN)
            },
            pagination: {
              page: 1,
              perPage: 10,
            },
            order: { by: "createdAt", direction: "desc" },
            userId: user.id,
          });

        expectToEqual(result, {
          data: [discussion3InList],
          pagination: {
            currentPage: 1,
            numberPerPage: 10,
            totalPages: 1,
            totalRecords: 1,
          },
        });
      });

      it("filters on the business name in search", async () => {
        const result =
          await pgDiscussionRepository.getPaginatedDiscussionsForUser({
            filters: {
              search: discussion3.businessName.slice(0, 4),
            },
            pagination: {
              page: 1,
              perPage: 10,
            },
            order: { by: "createdAt", direction: "desc" },
            userId: user.id,
          });

        expectToEqual(result, {
          data: [discussion3InList],
          pagination: {
            currentPage: 1,
            numberPerPage: 10,
            totalPages: 1,
            totalRecords: 1,
          },
        });
      });

      it("filters on the potential beneficiary first name", async () => {
        const result =
          await pgDiscussionRepository.getPaginatedDiscussionsForUser({
            filters: {
              search: discussion2.potentialBeneficiary.firstName.slice(0, 3),
            },
            pagination: {
              page: 1,
              perPage: 10,
            },
            order: { by: "createdAt", direction: "desc" },
            userId: user.id,
          });

        expectToEqual(result, {
          data: [discussion2InList],
          pagination: {
            currentPage: 1,
            numberPerPage: 10,
            totalPages: 1,
            totalRecords: 1,
          },
        });
      });

      it("filters on the potential beneficiary last name", async () => {
        const result =
          await pgDiscussionRepository.getPaginatedDiscussionsForUser({
            filters: {
              search: discussion3.potentialBeneficiary.lastName.slice(0, 3),
            },
            pagination: {
              page: 1,
              perPage: 10,
            },
            order: { by: "createdAt", direction: "desc" },
            userId: user.id,
          });

        expectToEqual(result, {
          data: [discussion3InList],
          pagination: {
            currentPage: 1,
            numberPerPage: 10,
            totalPages: 1,
            totalRecords: 1,
          },
        });
      });
    });

    it("supports pagination", async () => {
      const resultPage1 =
        await pgDiscussionRepository.getPaginatedDiscussionsForUser({
          pagination: {
            page: 1,
            perPage: 1,
          },
          userId: user.id,
          order: { by: "createdAt", direction: "desc" },
        });

      expectToEqual(resultPage1, {
        data: [discussion3InList],
        pagination: {
          currentPage: 1,
          numberPerPage: 1,
          totalPages: 2,
          totalRecords: 2,
        },
      });

      const resultPage2 =
        await pgDiscussionRepository.getPaginatedDiscussionsForUser({
          pagination: {
            page: 2,
            perPage: 1,
          },
          userId: user.id,
          order: { by: "createdAt", direction: "desc" },
        });

      expectToEqual(resultPage2, {
        data: [discussion2InList],
        pagination: {
          currentPage: 2,
          numberPerPage: 1,
          totalPages: 2,
          totalRecords: 2,
        },
      });
    });
  });

  describe("hasDiscussionMatching", () => {
    const discussionWithLastExchangeByPotentialBeneficiary1 =
      new DiscussionBuilder()
        .withId(uuid())
        .withSiret("00000000000001")
        .withEstablishmentContact({
          email: "test@email.com",
        })
        .withExchanges([
          {
            message: "",
            sender: "potentialBeneficiary",
            recipient: "establishment",
            sentAt: new Date("2023-07-07").toISOString(),
            subject: "exchange with potentialBeneficiary 1",
            attachments: [
              {
                link: "magicTokenBrevo",
                name: "monPdf.pdf",
              },
            ],
          },
        ])
        .withCreatedAt(new Date("2023-07-07"))
        .build();

    const discussionWithoutExchanges3 = new DiscussionBuilder()
      .withId(uuid())
      .withSiret("00000000000002")
      .withExchanges([])
      .withConventionId("some-convention-id")
      .withCreatedAt(new Date("2023-07-05"))
      .build();

    it.each([
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary1.siret,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          siret: discussionWithoutExchanges3.siret,
        },
        result: false,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary1.appellationCode,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .potentialBeneficiary.email,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          since: new Date(
            discussionWithLastExchangeByPotentialBeneficiary1.createdAt,
          ),
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          establishmentRepresentativeEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .establishmentContact.email,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary1.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary1.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .potentialBeneficiary.email,
          since: date,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary1.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary1.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .potentialBeneficiary.email,
          since: addDays(date, 1),
        },
        result: false,
      },
      {
        discussionInRepo: discussionWithoutExchanges3,
        params: {
          siret: discussionWithoutExchanges3.siret,
          appellationCode: discussionWithoutExchanges3.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithoutExchanges3.potentialBeneficiary.email,
          since: new Date(discussionWithoutExchanges3.createdAt),
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithoutExchanges3,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary1.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary1.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .potentialBeneficiary.email,
          since: addDays(new Date(discussionWithoutExchanges3.createdAt), 1),
        },
        result: false,
      },
    ] satisfies {
      discussionInRepo: DiscussionDto;
      params: Partial<HasDiscussionMatchingParams>;
      result: boolean;
    }[])(
      `hasDiscussionMatching '$result'
          with params: '$params'`,
      async ({ discussionInRepo, params, result }) => {
        await pgDiscussionRepository.insert(discussionInRepo);

        expectToEqual(
          await pgDiscussionRepository.hasDiscussionMatching(params),
          result,
        );
      },
    );

    it("throws when no params provided", async () => {
      await expectPromiseToFailWithError(
        pgDiscussionRepository.hasDiscussionMatching({}),
        errors.discussion.hasDiscussionMissingParams(),
      );
    });

    it("also returns discussion if discussion is searched by contact email and email is in copyEmails", async () => {
      const discussion = new DiscussionBuilder()
        .withId(uuid())
        .withEstablishmentContact({
          email: "other@email.com",
          copyEmails: ["searchedEmail@email.com"],
        })
        .build();
      await pgDiscussionRepository.insert(discussion);

      expectToEqual(
        await pgDiscussionRepository.hasDiscussionMatching({
          establishmentRepresentativeEmail: "searchedEmail@email.com",
        }),
        true,
      );
    });

    it("when there is no discussion", async () => {
      expectToEqual(
        await pgDiscussionRepository.hasDiscussionMatching({
          establishmentRepresentativeEmail: "searchedEmail@email.com",
        }),
        false,
      );
    });
  });

  describe("insert/update/getById", () => {
    describe("insert", () => {
      const tests: { discussion: DiscussionDto; title: string }[] = [
        {
          title: "insert with no hasWorkingExperience",
          discussion: new DiscussionBuilder()
            .withPotentialBeneficiaryHasWorkingExperience(false)
            .build(),
        },
        {
          title: "insert with acquisitionCampaign and acquisitionKeyword",
          discussion: new DiscussionBuilder()
            .withAcquisition({
              acquisitionCampaign: "campagne",
              acquisitionKeyword: "mot-clé",
            })
            .build(),
        },
        {
          title: "insert with status and conventionId",
          discussion: new DiscussionBuilder()
            .withStatus({ status: "ACCEPTED", candidateWarnedMethod: null })
            .withConventionId("some-convention-id")
            .build(),
        },
        {
          title:
            "insert with kind IF and contact mode EMAIL and with hasWorkingExperience 'non communiqué' (old discussions)",
          discussion: new DiscussionBuilder()
            .withDiscussionKind("IF")
            .withContactMode("EMAIL")
            .withPotentialBeneficiaryHasWorkingExperience(undefined)
            .build(),
        },
        {
          title: "insert with kind IF and contact mode EMAIL",
          discussion: new DiscussionBuilder()
            .withDiscussionKind("IF")
            .withContactMode("EMAIL")
            .build(),
        },
        {
          title:
            "insert with kind IF and contact mode EMAIL and empty datePreference",
          discussion: new DiscussionBuilder()
            .withDiscussionKind("IF")
            .withContactMode("EMAIL")
            .withDatePreference("")
            .build(),
        },
        {
          title: "insert with kind IF and contact mode PHONE",
          discussion: new DiscussionBuilder()
            .withDiscussionKind("IF")
            .withContactMode("PHONE")
            .withExchanges([])
            .build(),
        },
        {
          title: "insert with kind IF and contact mode IN_PERSON",
          discussion: new DiscussionBuilder()
            .withDiscussionKind("IF")
            .withContactMode("IN_PERSON")
            .withExchanges([])
            .build(),
        },
        {
          title: "insert with kind 1_ELEVE_1_STAGE and contact mode EMAIL",
          discussion: new DiscussionBuilder()
            .withDiscussionKind("1_ELEVE_1_STAGE")
            .withContactMode("EMAIL")
            .build(),
        },
        {
          title: "insert with kind 1_ELEVE_1_STAGE and contact mode PHONE",
          discussion: new DiscussionBuilder()
            .withDiscussionKind("1_ELEVE_1_STAGE")
            .withContactMode("PHONE")
            .withExchanges([])
            .build(),
        },
        {
          title: "insert with kind 1_ELEVE_1_STAGE and contact mode IN_PERSON",
          discussion: new DiscussionBuilder()
            .withDiscussionKind("1_ELEVE_1_STAGE")
            .withContactMode("IN_PERSON")
            .withExchanges([])
            .build(),
        },
      ];
      it.each(tests)("$title", async ({ discussion }) => {
        await pgDiscussionRepository.insert(discussion);

        expectToEqual(
          await pgDiscussionRepository.getById(discussion.id),
          discussion,
        );
      });
    });

    describe("update", () => {
      it("update with status REJECTED, conventionId and a candidate warn method", async () => {
        const siret = "01234567891011";
        const discussion = new DiscussionBuilder()
          .withSiret(siret)
          .withCreatedAt(new Date("2023-07-07"))
          .withStatus({ status: "PENDING" })
          .build();

        await pgDiscussionRepository.insert(discussion);

        const updatedDiscussion = new DiscussionBuilder(discussion)
          .withStatus({
            status: "REJECTED",
            rejectionKind: "CANDIDATE_ALREADY_WARNED",
            candidateWarnedMethod: "phone",
          })
          .withConventionId("some-other-convention-id")
          .build();

        await pgDiscussionRepository.update(updatedDiscussion);

        expectToEqual(
          await db
            .selectFrom("discussions")
            .select([
              "status",
              "convention_id",
              "rejection_kind",
              "candidate_warned_method",
            ])
            .executeTakeFirst(),
          {
            status: "REJECTED",
            convention_id: "some-other-convention-id",
            rejection_kind: "CANDIDATE_ALREADY_WARNED",
            candidate_warned_method: "phone",
          },
        );
      });

      it("update with status REJECTED with reason", async () => {
        const siret = "01234567891011";
        const discussion = new DiscussionBuilder()
          .withSiret(siret)
          .withCreatedAt(new Date("2023-07-07"))
          .withStatus({ status: "PENDING" })
          .build();

        await pgDiscussionRepository.insert(discussion);

        const updatedDiscussion = new DiscussionBuilder(discussion)
          .withStatus({
            status: "REJECTED",
            rejectionKind: "OTHER",
            rejectionReason: "my custom reason",
          })
          .build();

        await pgDiscussionRepository.update(updatedDiscussion);

        expectToEqual(
          await db
            .selectFrom("discussions")
            .select(["status", "rejection_reason"])
            .executeTakeFirst(),
          {
            status: "REJECTED",
            rejection_reason: "my custom reason",
          },
        );
      });

      it("update with status ACCEPTED", async () => {
        const siret = "01234567891011";
        const discussion = new DiscussionBuilder()
          .withSiret(siret)
          .withCreatedAt(new Date("2023-07-07"))
          .withStatus({ status: "PENDING" })
          .build();

        await pgDiscussionRepository.insert(discussion);

        const updatedDiscussion = new DiscussionBuilder(discussion)
          .withStatus({ status: "ACCEPTED", candidateWarnedMethod: null })
          .build();

        await pgDiscussionRepository.update(updatedDiscussion);

        expectToEqual(
          await db
            .selectFrom("discussions")
            .select(["status"])
            .executeTakeFirst(),
          {
            status: "ACCEPTED",
          },
        );
      });
    });

    it("getById undefined when there is no discussion", async () => {
      expectToEqual(await pgDiscussionRepository.getById(uuid()), undefined);
    });
  });

  describe("deleteOldMessages", () => {
    it("Deletes messages from old discussions", async () => {
      const siret = "12212222333344";
      const since = new Date("2023-03-05");

      await establishmentAggregateRepo.insertEstablishmentAggregate(
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret)
          .withUserRights([
            {
              role: "establishment-admin",
              userId: user.id,
              job: "",
              phone: "",
            },
          ])
          .withOffers([offer])
          .build(),
      );

      const discussionWithRecentExchange = new DiscussionBuilder()
        .withSiret(siret)
        .withId("bcbbbd2c-6f02-11ec-90d6-0242ac120104")
        .withCreatedAt(new Date("2023-11-11"))
        .withExchanges([
          {
            subject: "mon nouveau sujet",
            message: "mon nouveau message",
            recipient: "potentialBeneficiary",
            sentAt: new Date("2023-11-11").toISOString(),
            sender: "establishment",
            attachments: [],
          },
        ])
        .build();

      const discussionWithOldExchange = new DiscussionBuilder()
        .withSiret(siret)
        .withId("bcbbbd2c-6f02-11ec-90d6-0242ac120103")
        .withCreatedAt(new Date("2022-11-11"))
        .withExchanges([
          {
            subject: "mon nouveau sujet",
            message: "mon nouveau message",
            recipient: "potentialBeneficiary",
            sentAt: new Date("2022-11-11").toISOString(),
            sender: "establishment",
            attachments: [
              {
                link: "dlskfjsdmlfsdmlfjsdmlfj",
                name: "pj",
              },
            ],
          },
        ])
        .build();

      await Promise.all([
        pgDiscussionRepository.insert(discussionWithRecentExchange),
        pgDiscussionRepository.insert(discussionWithOldExchange),
      ]);

      const numberOfUpdatedMessages =
        await pgDiscussionRepository.deleteOldMessages(since);

      expectToEqual(numberOfUpdatedMessages, 1);

      expectToEqual(
        await pgDiscussionRepository.getById(discussionWithRecentExchange.id),
        discussionWithRecentExchange,
      );

      expectToEqual(
        await pgDiscussionRepository.getById(discussionWithOldExchange.id),
        new DiscussionBuilder(discussionWithOldExchange)
          .withExchanges([
            {
              ...discussionWithOldExchange.exchanges[0],
              message: "Supprimé car trop ancien",
              attachments: [],
            },
          ])
          .build(),
      );
    });
  });

  describe("countDiscussionsForSiretSince", () => {
    const establishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("11112222333344")
      .withUserRights([
        {
          role: "establishment-admin",
          userId: user.id,
          job: "",
          phone: "",
        },
      ])
      .withOffers([offer])
      .build();

    beforeEach(async () => {
      await establishmentAggregateRepo.insertEstablishmentAggregate(
        establishmentAggregate,
      );

      const discussion1 = new DiscussionBuilder()
        .withSiret(establishmentAggregate.establishment.siret)
        .withId("bbbbbd2c-6f02-11ec-90d6-0242ac120003")
        .withCreatedAt(new Date("2023-03-05"))
        .build();

      const discussion2 = new DiscussionBuilder()
        .withSiret(establishmentAggregate.establishment.siret)
        .withId("cccccd2c-6f02-11ec-90d6-0242ac120003")
        .withCreatedAt(new Date("2023-03-07"))
        .build();

      const discussionToOld = new DiscussionBuilder()
        .withSiret(establishmentAggregate.establishment.siret)
        .withId("aaaaad2c-6f02-11ec-90d6-0242ac120003")
        .withCreatedAt(new Date("2023-03-04"))
        .build();

      await Promise.all([
        pgDiscussionRepository.insert(discussion1),
        pgDiscussionRepository.insert(discussion2),
        pgDiscussionRepository.insert(discussionToOld),
      ]);
    });

    it("right path with 2", async () => {
      expectToEqual(
        await pgDiscussionRepository.countDiscussionsForSiretSince(
          establishmentAggregate.establishment.siret,
          new Date("2023-03-05"),
        ),
        2,
      );
    });

    it("right path with 0", async () => {
      expectToEqual(
        await pgDiscussionRepository.countDiscussionsForSiretSince(
          establishmentAggregate.establishment.siret,
          new Date("2023-03-08"),
        ),
        0,
      );
    });
  });
});
