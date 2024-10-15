import {
  AgencyDtoBuilder,
  AgencyRight,
  User,
  errors,
  expectArraysToEqual,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UpdateAgencyReferringToUpdatedAgency } from "./UpdateAgencyReferringToUpdatedAgency";

describe("UpdateAgencyReferingToUpdatedAgency", () => {
  const otherAgency = new AgencyDtoBuilder()
    .withId("100")
    .withName("Agency not impacted by the usecase")
    .withValidatorEmails(["update@mail.com"])
    .build();

  const updatedAgency = new AgencyDtoBuilder()
    .withId("1")
    .withName("Agency 1 (updated)")
    .withValidatorEmails(["update@mail.com"])
    .build();
  const agency2RefersToUpdatedAgency = new AgencyDtoBuilder()
    .withId("2")
    .withName("Structure accompagnement 2 referent à l'agence 1")
    .withValidatorEmails(["not.updated@mail.com"])
    .withRefersToAgencyInfo({
      refersToAgencyId: updatedAgency.id,
      refersToAgencyName: updatedAgency.name,
    })
    .build();
  const agency3RefersToUpdatedAgency = new AgencyDtoBuilder()
    .withId("3")
    .withName("Structure accompagnement 3 referent à l'agence 1")
    .withValidatorEmails(["not.updated@mail.com"])
    .withRefersToAgencyInfo({
      refersToAgencyId: updatedAgency.id,
      refersToAgencyName: updatedAgency.name,
    })
    .build();
  const agencyNotReferingToUpdatedAgency = new AgencyDtoBuilder()
    .withId("4")
    .withName("Agency 4")
    .withValidatorEmails(["not.updated@mail.com"])
    .build();

  const otherAgencyRight: AgencyRight = {
    agency: otherAgency,
    roles: ["validator"],
    isNotifiedByEmail: false,
  };

  let uow: InMemoryUnitOfWork;
  let updateAgencyReferringToUpdatedAgency: UpdateAgencyReferringToUpdatedAgency;
  let createNewEvent: CreateNewEvent;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator,
    });
    updateAgencyReferringToUpdatedAgency =
      new UpdateAgencyReferringToUpdatedAgency(
        new InMemoryUowPerformer(uow),
        createNewEvent,
      );
  });

  it("throw error when agency not found", () => {
    expectPromiseToFailWithError(
      updateAgencyReferringToUpdatedAgency.execute({
        agencyId: updatedAgency.id,
      }),
      errors.agency.notFound({ agencyId: updatedAgency.id }),
    );
  });

  describe("right paths", () => {
    it("update agencies validator emails that refers to updated agency", async () => {
      const notifiedUser: User = {
        id: "notified-user",
        email: updatedAgency.validatorEmails.at(0) ?? "",
        lastName: "Notified",
        firstName: "User",
        createdAt: new Date().toISOString(),
        externalId: null,
      };
      const notNotifiedUser: User = {
        id: "not-notified-by-email-user",
        email: "notNotifiedByEmailUser@email.fr",
        lastName: "Doe",
        firstName: "John",
        createdAt: new Date().toISOString(),
        externalId: null,
      };

      uuidGenerator.setNextUuids(["event1", "event2"]);

      uow.agencyRepository.setAgencies([
        otherAgency,
        updatedAgency,
        agency2RefersToUpdatedAgency,
        agency3RefersToUpdatedAgency,
      ]);

      await uow.userRepository.save(notifiedUser);
      await uow.userRepository.save(notNotifiedUser);

      await uow.userRepository.updateAgencyRights({
        userId: notifiedUser.id,
        agencyRights: [
          otherAgencyRight,
          {
            agency: updatedAgency,
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        ],
      });

      await uow.userRepository.updateAgencyRights({
        userId: notNotifiedUser.id,
        agencyRights: [
          otherAgencyRight,
          {
            agency: updatedAgency,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
          {
            agency: agency2RefersToUpdatedAgency,
            roles: ["counsellor"],
            isNotifiedByEmail: false,
          },
        ],
      });

      await updateAgencyReferringToUpdatedAgency.execute({
        agencyId: updatedAgency.id,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        updatedAgency,
        {
          ...agency2RefersToUpdatedAgency,
          validatorEmails: updatedAgency.validatorEmails,
        },
        {
          ...agency3RefersToUpdatedAgency,
          validatorEmails: updatedAgency.validatorEmails,
        },
        otherAgency,
      ]);

      expectArraysToEqual(
        uow.userRepository.agencyRightsByUserId[notNotifiedUser.id],
        [
          otherAgencyRight,
          {
            agency: updatedAgency,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
          {
            agency: agency2RefersToUpdatedAgency,
            roles: ["counsellor"],
            isNotifiedByEmail: false,
          },
        ],
      );

      expectArraysToEqual(
        uow.userRepository.agencyRightsByUserId[notifiedUser.id],
        [
          otherAgencyRight,
          {
            agency: updatedAgency,
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        ],
      );

      expectToEqual(uow.outboxRepository.events, [
        {
          ...createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agencyId: agency2RefersToUpdatedAgency.id,
              triggeredBy: {
                kind: "crawler",
              },
            },
          }),
          id: "event1",
        },
        {
          ...createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agencyId: agency3RefersToUpdatedAgency.id,
              triggeredBy: {
                kind: "crawler",
              },
            },
          }),
          id: "event2",
        },
      ]);
    });

    it("do nothing when there no related agencies that refers to updated agency", async () => {
      uow.agencyRepository.setAgencies([
        updatedAgency,
        agencyNotReferingToUpdatedAgency,
      ]);

      await updateAgencyReferringToUpdatedAgency.execute({
        agencyId: updatedAgency.id,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        updatedAgency,
        agencyNotReferingToUpdatedAgency,
      ]);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});
