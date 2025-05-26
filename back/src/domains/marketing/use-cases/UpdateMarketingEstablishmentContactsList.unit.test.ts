import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  UserBuilder,
  defaultProConnectInfos,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  isSuperEstablishment,
} from "shared";
import { v4 as uuid } from "uuid";
import { toAgencyWithRights } from "../../../utils/agency";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import type { EstablishmentUserRight } from "../../establishment/entities/EstablishmentAggregate";
import { EstablishmentAggregateBuilder } from "../../establishment/helpers/EstablishmentBuilders";
import { InMemoryEstablishmentMarketingGateway } from "../adapters/establishmentMarketingGateway/InMemoryEstablishmentMarketingGateway";
import type { MarketingContact } from "../entities/MarketingContact";
import type { EstablishmentMarketingGatewayDto } from "../ports/EstablishmentMarketingGateway";
import type { EstablishmentMarketingContactEntity } from "../ports/EstablishmentMarketingRepository";
import {
  type UpdateMarketingEstablishmentContactList,
  makeUpdateMarketingEstablishmentContactList,
} from "./UpdateMarketingEstablishmentContactsList";

describe("UpdateMarketingEstablishmentContactsList", () => {
  let marketingGateway: InMemoryEstablishmentMarketingGateway;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let updateMarketingEstablishmentContactList: UpdateMarketingEstablishmentContactList;
  const now = new Date();

  const userMarketingContact = new UserBuilder()
    .withFirstName("Other first name")
    .build();

  const establishmentRight: EstablishmentUserRight = {
    userId: userMarketingContact.id,
    job: "Marketing Contact",
    phone: "",
    role: "establishment-admin",
  };

  const establishment = new EstablishmentAggregateBuilder()
    .withSearchableBy({ jobSeekers: true, students: false })
    .withUserRights([establishmentRight])
    .withScore(51)
    .build();

  const firstConventionValidationDate = new Date("2024-05-25");
  const lastConventionValidationDate = new Date("2024-07-01");
  const agency = new AgencyDtoBuilder().build();
  const firstConvention = new ConventionDtoBuilder()
    .withId(uuid())
    .withSiret(establishment.establishment.siret)
    .withAgencyId(agency.id)
    .validated()
    .withDateValidation(firstConventionValidationDate.toISOString())
    .withDateEnd("2024-05-30T08:00:00.000Z")
    .build();
  const middleConvention = new ConventionDtoBuilder()
    .withId(uuid())
    .withSiret(establishment.establishment.siret)
    .withAgencyId(agency.id)
    .validated()
    .withDateValidation("2024-06-25T08:00:00.000Z")
    .withDateEnd("2024-06-30T08:00:00.000Z")
    .build();
  const lastConvention = new ConventionDtoBuilder()
    .withId(uuid())
    .withSiret(establishment.establishment.siret)
    .withAgencyId(agency.id)
    .validated()
    .withDateValidation(lastConventionValidationDate.toISOString())
    .withDateEnd("2024-07-09T08:00:00.000Z")
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway(now);
    marketingGateway = new InMemoryEstablishmentMarketingGateway();
    updateMarketingEstablishmentContactList =
      makeUpdateMarketingEstablishmentContactList({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: { establishmentMarketingGateway: marketingGateway, timeGateway },
      });
    uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
    uow.userRepository.users = [userMarketingContact];
  });

  describe("With Establishment in repo", () => {
    const establishmentMarketingGatewayDto: EstablishmentMarketingGatewayDto = {
      email: userMarketingContact.email,
      firstName: userMarketingContact.firstName,
      lastName: userMarketingContact.lastName,
      conventions: { numberOfValidatedConvention: 0 },
      departmentCode:
        establishment.establishment.locations[0].address.departmentCode,
      hasIcAccount: false,
      isCommited: establishment.establishment.isCommited,
      isRegistered: true,
      maxContactsPerMonth: establishment.establishment.maxContactsPerMonth,
      nafCode: establishment.establishment.nafDto.code,
      nextAvailabilityDate:
        establishment.establishment.nextAvailabilityDate &&
        new Date(establishment.establishment.nextAvailabilityDate),
      numberEmployeesRange: establishment.establishment.numberEmployeesRange,
      numberOfDiscussionsAnswered: 0,
      numberOfDiscussionsReceived: 0,
      searchableBy: "jobSeekers",
      siret: establishment.establishment.siret,
      romes: establishment.offers.map(({ romeCode }) => romeCode),
      isSuperEstablishment: isSuperEstablishment(
        establishment.establishment.score,
      ),
    };

    const marketingContact: MarketingContact = {
      createdAt: now,
      email: userMarketingContact.email,
      firstName: userMarketingContact.firstName,
      lastName: userMarketingContact.lastName,
    };

    const establishmentMarketingContactEntity: EstablishmentMarketingContactEntity =
      {
        contactEmail: userMarketingContact.email,
        siret: establishment.establishment.siret,
        emailContactHistory: [marketingContact],
      };

    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
      ];
    });

    it("Add establishment marketting contact when establishment exist in repo but not in marketting contact list", async () => {
      marketingGateway.marketingEstablishments = [];

      await updateMarketingEstablishmentContactList.execute({
        siret: establishment.establishment.siret,
      });

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        establishmentMarketingContactEntity,
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        establishmentMarketingGatewayDto,
      ]);
    });

    it("Update establishment marketing contact when establishment exist in repo and in marketting contact list", async () => {
      const previousContact: MarketingContact = {
        createdAt: new Date(),
        email: "Bidule@gail.com",
        firstName: "bibi",
        lastName: "machin",
      };
      uow.establishmentMarketingRepository.contacts = [
        {
          ...establishmentMarketingContactEntity,
          contactEmail: previousContact.email,
          emailContactHistory: [previousContact],
        },
      ];

      marketingGateway.marketingEstablishments = [
        {
          email: previousContact.email,
          firstName: previousContact.firstName,
          lastName: previousContact.lastName,
          conventions: {
            numberOfValidatedConvention: 20,
            lastConvention: {
              endDate: new Date(),
              validationDate: new Date(),
            },
            firstConventionValidationDate: new Date(),
          },
          departmentCode: "974",
          hasIcAccount: true,
          isRegistered: true,
          maxContactsPerMonth: 99999,
          nafCode: "789",
          numberOfDiscussionsAnswered: 657486,
          numberOfDiscussionsReceived: 121234256,
          searchableBy: "jobSeekers",
          siret: establishment.establishment.siret,
          isCommited: false,
          nextAvailabilityDate: new Date(),
          numberEmployeesRange: "+10000",
          romes: establishment.offers.map(({ romeCode }) => romeCode),
          isSuperEstablishment: isSuperEstablishment(
            establishment.establishment.score,
          ),
        },
      ];

      await updateMarketingEstablishmentContactList.execute({
        siret: establishment.establishment.siret,
      });

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        {
          ...establishmentMarketingContactEntity,
          emailContactHistory: [marketingContact, previousContact],
        },
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        establishmentMarketingGatewayDto,
      ]);
    });

    describe("Update convention related properties", () => {
      beforeEach(() => {
        uow.establishmentMarketingRepository.contacts = [
          establishmentMarketingContactEntity,
        ];

        marketingGateway.marketingEstablishments = [
          establishmentMarketingGatewayDto,
        ];
      });

      it("Doesn't update marketting contact convention related properties if no convention were found and establishment in repo", async () => {
        uow.conventionRepository.setConventions([]);

        await updateMarketingEstablishmentContactList.execute({
          siret: establishment.establishment.siret,
        });

        expectToEqual(uow.establishmentMarketingRepository.contacts, [
          establishmentMarketingContactEntity,
        ]);

        expectToEqual(marketingGateway.marketingEstablishments, [
          establishmentMarketingGatewayDto,
        ]);
      });

      it("Update convention related properties without contact infos if conventions were found and establishment in repo", async () => {
        const notValidatedConvention = new ConventionDtoBuilder()
          .withId(uuid())
          .withStatus("READY_TO_SIGN")
          .withSiret(establishment.establishment.siret)
          .withAgencyId(agency.id)
          .withoutDateValidation()
          .build();
        uow.conventionRepository.setConventions([
          lastConvention,
          notValidatedConvention,
          middleConvention,
          firstConvention,
        ]);

        await updateMarketingEstablishmentContactList.execute({
          siret: establishment.establishment.siret,
        });

        expectToEqual(uow.establishmentMarketingRepository.contacts, [
          establishmentMarketingContactEntity,
        ]);

        expectToEqual(marketingGateway.marketingEstablishments, [
          {
            ...establishmentMarketingGatewayDto,
            conventions: {
              numberOfValidatedConvention: 3,
              lastConvention: {
                endDate: new Date(lastConvention.dateEnd),
                validationDate: lastConventionValidationDate,
              },
              firstConventionValidationDate: firstConventionValidationDate,
            },
          },
        ]);
      });
    });

    it("Update has ic user property when establishment in repo", async () => {
      uow.userRepository.users = [
        new UserBuilder(userMarketingContact)
          .withProConnectInfos(defaultProConnectInfos)
          .build(),
      ];

      await updateMarketingEstablishmentContactList.execute({
        siret: establishment.establishment.siret,
      });

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        establishmentMarketingContactEntity,
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        {
          ...establishmentMarketingGatewayDto,
          hasIcAccount: true,
        },
      ]);
    });

    it("Update discussion related property", async () => {
      const discussionAnswered = new DiscussionBuilder()
        .withId(uuid())
        .withSiret(establishment.establishment.siret)
        .withExchanges([
          {
            message: "",
            sender: "potentialBeneficiary",
            recipient: "establishment",
            sentAt: now.toISOString(),
            subject: "",
            attachments: [],
          },
          {
            message: "",
            sender: "establishment",
            recipient: "potentialBeneficiary",
            sentAt: now.toISOString(),
            subject: "",
            attachments: [],
          },
        ])
        .build();
      const discussionNotAnswered = new DiscussionBuilder()
        .withId(uuid())
        .withSiret(establishment.establishment.siret)
        .withExchanges([
          {
            message: "",
            sender: "potentialBeneficiary",
            recipient: "establishment",
            sentAt: now.toISOString(),
            subject: "",
            attachments: [],
          },
        ])
        .build();

      uow.discussionRepository.discussions = [
        discussionNotAnswered,
        discussionAnswered,
      ];
      uow.establishmentMarketingRepository.contacts = [
        establishmentMarketingContactEntity,
      ];
      marketingGateway.marketingEstablishments = [
        establishmentMarketingGatewayDto,
      ];

      await updateMarketingEstablishmentContactList.execute({
        siret: establishment.establishment.siret,
      });

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        establishmentMarketingContactEntity,
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        {
          ...establishmentMarketingGatewayDto,
          numberOfDiscussionsAnswered: 1,
          numberOfDiscussionsReceived: 2,
        },
      ]);
    });

    it("on missing user in repo", () => {
      uow.userRepository.users = [];

      expectPromiseToFailWithError(
        updateMarketingEstablishmentContactList.execute({
          siret: establishment.establishment.siret,
        }),
        errors.user.notFound({ userId: establishmentRight.userId }),
      );
    });

    it("on missing establishment admin right", () => {
      const establishmentWithoutAdminRights = new EstablishmentAggregateBuilder(
        establishment,
      )
        .withUserRights([
          {
            role: "establishment-contact",
            userId: userMarketingContact.id,
          },
        ])
        .build();
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentWithoutAdminRights,
      ];

      expectPromiseToFailWithError(
        updateMarketingEstablishmentContactList.execute({
          siret: establishment.establishment.siret,
        }),
        errors.establishment.adminNotFound({
          siret: establishmentWithoutAdminRights.establishment.siret,
        }),
      );
    });
  });

  describe("Without Establishment in repo", () => {
    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];
    });

    const convention = new ConventionDtoBuilder()
      .withSiret("11112222333344")
      .withDateValidation(firstConventionValidationDate.toISOString())
      .validated()
      .build();

    const conventionMarketingContact: MarketingContact = {
      createdAt: now,
      email: convention.signatories.establishmentRepresentative.email,
      firstName: convention.signatories.establishmentRepresentative.firstName,
      lastName: convention.signatories.establishmentRepresentative.lastName,
    };

    const establishmentMarketingGatewayDto: EstablishmentMarketingGatewayDto = {
      email: conventionMarketingContact.email,
      firstName: conventionMarketingContact.firstName,
      lastName: conventionMarketingContact.lastName,
      conventions: {
        numberOfValidatedConvention: 1,
        firstConventionValidationDate: firstConventionValidationDate,
        lastConvention: {
          endDate: new Date(convention.dateEnd),
          validationDate: firstConventionValidationDate,
        },
      },
      hasIcAccount: false,
      isRegistered: false,
      siret: convention.siret,
      numberEmployeesRange: convention.establishmentNumberEmployeesRange,
    };

    const establishmentMarketingContactEntity: EstablishmentMarketingContactEntity =
      {
        contactEmail: convention.signatories.establishmentRepresentative.email,
        siret: convention.siret,
        emailContactHistory: [conventionMarketingContact],
      };

    it("Add contact property & convention related properties of establishment marketing contact when convention were found", async () => {
      marketingGateway.marketingEstablishments = [];
      uow.conventionRepository.setConventions([convention]);

      await updateMarketingEstablishmentContactList.execute({
        siret: convention.siret,
      });

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        establishmentMarketingContactEntity,
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        establishmentMarketingGatewayDto,
      ]);
    });

    it("Update contact property & convention related properties of establishment marketing contact when convention were found", async () => {
      uow.conventionRepository.setConventions([convention]);

      const previousContact: MarketingContact = {
        createdAt: new Date(),
        email: "Bidule@gail.com",
        firstName: "bibi",
        lastName: "machin",
      };

      uow.establishmentMarketingRepository.contacts = [
        {
          ...establishmentMarketingContactEntity,
          contactEmail: previousContact.email,
          emailContactHistory: [previousContact],
        },
      ];

      marketingGateway.marketingEstablishments = [
        {
          email: previousContact.email,
          firstName: previousContact.firstName,
          lastName: previousContact.lastName,
          conventions: {
            numberOfValidatedConvention: 20,
            lastConvention: {
              endDate: new Date(),
              validationDate: new Date(),
            },
            firstConventionValidationDate: new Date(),
          },
          romes: establishment.offers.map(({ romeCode }) => romeCode),
          departmentCode: "974",
          hasIcAccount: true,
          isRegistered: true,
          maxContactsPerMonth: 99999,
          nafCode: "789",
          numberOfDiscussionsAnswered: 657486,
          numberOfDiscussionsReceived: 121234256,
          searchableBy: "jobSeekers",
          siret: convention.siret,
          isCommited: false,
          nextAvailabilityDate: new Date(),
          numberEmployeesRange: "+10000",
          isSuperEstablishment: isSuperEstablishment(
            establishment.establishment.score,
          ),
        },
      ];

      await updateMarketingEstablishmentContactList.execute({
        siret: convention.siret,
      });

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        {
          ...establishmentMarketingContactEntity,
          emailContactHistory: [conventionMarketingContact, previousContact],
        },
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        { ...establishmentMarketingGatewayDto },
      ]);
    });

    it("Remove establishment marketing if no convention were found", async () => {
      uow.conventionRepository.setConventions([]);

      uow.establishmentMarketingRepository.contacts = [
        establishmentMarketingContactEntity,
      ];

      marketingGateway.marketingEstablishments = [
        establishmentMarketingGatewayDto,
      ];

      await updateMarketingEstablishmentContactList.execute({
        siret: convention.siret,
      });
      expectToEqual(uow.establishmentMarketingRepository.contacts, []);

      expectToEqual(marketingGateway.marketingEstablishments, []);
    });
  });
});
