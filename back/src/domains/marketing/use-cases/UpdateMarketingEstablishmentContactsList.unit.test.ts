import { expectToEqual } from "shared";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
} from "../../establishment/helpers/EstablishmentBuilders";
import { InMemoryMarketingGateway } from "../adapters/MarketingGateway/InMemoryMartekingGateway";
import { MarketingContact } from "../entities/MarketingContact";
import {
  UpdateMarketingEstablishmentContactList,
  makeUpdateMarketingEstablishmentContactList,
} from "./UpdateMarketingEstablishmentContactsList";

describe("UpdateMarketingEstablishmentContactsList", () => {
  let marketingGateway: InMemoryMarketingGateway;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let updateMarketingEstablishmentContactList: UpdateMarketingEstablishmentContactList;

  const contact = new ContactEntityBuilder().build();

  const establishment = new EstablishmentAggregateBuilder()
    .withContact(contact)
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    marketingGateway = new InMemoryMarketingGateway();
    updateMarketingEstablishmentContactList =
      makeUpdateMarketingEstablishmentContactList({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: { marketingGateway, timeGateway },
      });
  });

  describe("Establishment registered", () => {
    it("Add establishment marketting contact when establishment exist in repo but not in marketting contact list", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
      ];

      expectToEqual(marketingGateway.marketingEstablishments, []);

      await updateMarketingEstablishmentContactList.execute(
        establishment.establishment.siret,
        undefined,
      );

      const expectedContact: MarketingContact = {
        name: contact.firstName,
        surname: contact.lastName,
        email: contact.email,
        createdAt: timeGateway.now(),
      };

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        {
          contactEmail: contact.email,
          siret: establishment.establishment.siret,
          emailContactHistory: [expectedContact],
        },
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        {
          contact: expectedContact,
          conventions: {
            numberOfConventions: 0,
          },
          departmentCode:
            establishment.establishment.locations[0].address.departmentCode,
          hasIcAccount: false,
          isRegistered: true,
          maxContactsPerWeek: establishment.establishment.maxContactsPerWeek,
          nafCode: establishment.establishment.nafDto.code,
          numberOfDiscussionsAnswered: 0,
          numberOfDiscussionsReceived: 0,
          searchableBy: "all",
          siret: establishment.establishment.siret,
          isCommited: establishment.establishment.isCommited,
          nextAvailabilityDate:
            establishment.establishment.nextAvailabilityDate,
          numberEmployeesRange:
            establishment.establishment.numberEmployeesRange,
        },
      ]);
    });

    it.skip("What if we don't have any contact for establishment in repo ???", async () => {
      const establishementWithoutContact = new EstablishmentAggregateBuilder()
        .withoutContact()
        .build();
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishementWithoutContact,
      ];

      expectToEqual(marketingGateway.marketingEstablishments, [
        //????
      ]);

      uow.conventionRepository.setConventions([]);

      await updateMarketingEstablishmentContactList.execute(
        establishment.establishment.siret,
        undefined,
      );

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        /// ???
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        // ???
      ]);
    });

    it("Update establishment marketing contact when establishment exist in repo and in marketting contact list", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishment,
      ];

      const previousContact: MarketingContact = {
        createdAt: new Date(),
        email: "Bidule@gail.com",
        name: "bibi",
        surname: "machin",
      };

      uow.establishmentMarketingRepository.contacts = [
        {
          contactEmail: contact.email,
          siret: establishment.establishment.siret,
          emailContactHistory: [previousContact],
        },
      ];

      marketingGateway.marketingEstablishments = [
        {
          contact: previousContact,
          conventions: {
            numberOfConventions: 20,
            endDateOfLastConvention: new Date().toISOString(),
            firstConventionValidationDate: new Date().toISOString(),
            lastCoventionValidationDate: new Date().toISOString(),
          },
          departmentCode: "974",
          hasIcAccount: true,
          isRegistered: false,
          maxContactsPerWeek: 99999,
          nafCode: "789",
          numberOfDiscussionsAnswered: 657486,
          numberOfDiscussionsReceived: 121234256,
          searchableBy: "jobSeekers",
          siret: "0000000000",
          isCommited: false,
          nextAvailabilityDate: new Date().toISOString(),
          numberEmployeesRange: "+10000",
        },
      ];

      await updateMarketingEstablishmentContactList.execute(
        establishment.establishment.siret,
        undefined,
      );

      const expectedContact: MarketingContact = {
        name: contact.firstName,
        surname: contact.lastName,
        email: contact.email,
        createdAt: timeGateway.now(),
      };

      expectToEqual(uow.establishmentMarketingRepository.contacts, [
        {
          contactEmail: contact.email,
          siret: establishment.establishment.siret,
          emailContactHistory: [expectedContact, previousContact],
        },
      ]);

      expectToEqual(marketingGateway.marketingEstablishments, [
        {
          contact: expectedContact,
          conventions: {
            numberOfConventions: 0,
          },
          departmentCode:
            establishment.establishment.locations[0].address.departmentCode,
          hasIcAccount: false,
          isRegistered: true,
          maxContactsPerWeek: establishment.establishment.maxContactsPerWeek,
          nafCode: establishment.establishment.nafDto.code,
          numberOfDiscussionsAnswered: 0,
          numberOfDiscussionsReceived: 0,
          searchableBy: "all",
          siret: establishment.establishment.siret,
          isCommited: establishment.establishment.isCommited,
          nextAvailabilityDate:
            establishment.establishment.nextAvailabilityDate,
          numberEmployeesRange:
            establishment.establishment.numberEmployeesRange,
        },
      ]);
    });

    // it("Doesn't update marketting contact convention related properties if no convention were found and establishment in repo", async () => {

    //  await Promise;

    //  expect(true).toBe(false)
    // });

    // it("Doesn't update contact property of establishment marketing contact if establishment in repo and convention were found", async () => {

    //  await Promise;

    //  expect(true).toBe(false)
    // });

    // it('Update has ic user property when establishment in repo', async () => {

    //  await Promise;

    //  expect(true).toBe(false)
    // });
  });

  describe("Establishment Lead", () => {
    // it("Add establishment marketting contact when establishment not in repo and not in contact list", async () => {
    //   await Promise;
    //   expect(true).toBe(false);
    // });
    // it("Update establishment marketting contact when establishment not in repo and in contact list", async () => {
    //   await Promise;
    //   expect(true).toBe(false);
    // });
    // it("Fail if no convention were found and establishment is not registered", async () => {
    //   await Promise;
    //   expect(true).toBe(false);
    // });
    // it('Update contact property of establishment marketing contact if establishment not in repo and convention were found', async () => {
    //  await Promise;
    //  expect(true).toBe(false)
    // });
  });
  // it('add new contact in contact history when contact establishment change', async () => {

  //  await Promise;

  //  expect(true).toBe(false)
  // });
});
