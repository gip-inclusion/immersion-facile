import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
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

const icUser = new InclusionConnectedUserBuilder().build();

describe("UpdateAgencyReferingToUpdatedAgency", () => {
  const updatedAgency = new AgencyDtoBuilder()
    .withId("1")
    .withValidatorEmails(["update@mail.com"])
    .build();
  const agencyRefersToUpdatedAgency1 = new AgencyDtoBuilder()
    .withId("2")
    .withValidatorEmails(["not.updated@mail.com"])
    .withRefersToAgencyId(updatedAgency.id)
    .build();
  const agencyRefersToUpdatedAgency2 = new AgencyDtoBuilder()
    .withId("3")
    .withValidatorEmails(["not.updated@mail.com"])
    .withRefersToAgencyId(updatedAgency.id)
    .build();
  const agencyNotReferingToUpdatedAgency = new AgencyDtoBuilder()
    .withId("4")
    .withValidatorEmails(["not.updated@mail.com"])
    .build();

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
      updateAgencyReferringToUpdatedAgency.execute(
        { agencyId: updatedAgency.id },
        icUser,
      ),
      errors.agency.notFound({ agencyId: updatedAgency.id }),
    );
  });

  describe("right paths", () => {
    it("update agencies validator emails that refers to updated agency", async () => {
      uuidGenerator.setNextUuids(["event1", "event2"]);
      uow.agencyRepository.setAgencies([
        updatedAgency,
        agencyRefersToUpdatedAgency1,
        agencyRefersToUpdatedAgency2,
      ]);
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
      await uow.userRepository.save(notifiedUser);
      await uow.userRepository.save(notNotifiedUser);
      await uow.userRepository.updateAgencyRights({
        userId: notifiedUser.id,
        agencyRights: [
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
          {
            agency: updatedAgency,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
          {
            agency: agencyRefersToUpdatedAgency1,
            roles: ["counsellor"],
            isNotifiedByEmail: false,
          },
        ],
      });

      await updateAgencyReferringToUpdatedAgency.execute(
        { agencyId: updatedAgency.id },
        icUser,
      );

      expectToEqual(uow.agencyRepository.agencies, [
        updatedAgency,
        {
          ...agencyRefersToUpdatedAgency1,
          validatorEmails: updatedAgency.validatorEmails,
        },
        {
          ...agencyRefersToUpdatedAgency2,
          validatorEmails: updatedAgency.validatorEmails,
        },
      ]);

      expectArraysToEqual(
        uow.userRepository.agencyRightsByUserId[notNotifiedUser.id],
        [
          {
            agency: updatedAgency,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
          {
            agency: {
              ...agencyRefersToUpdatedAgency1,
              validatorEmails: updatedAgency.validatorEmails,
            },
            roles: ["counsellor", "validator"],
            isNotifiedByEmail: false,
          },
          {
            agency: {
              ...agencyRefersToUpdatedAgency2,
              validatorEmails: updatedAgency.validatorEmails,
            },
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        ],
      );

      expectToEqual(uow.outboxRepository.events, [
        {
          ...createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agencyId: agencyRefersToUpdatedAgency1.id,
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
              agencyId: agencyRefersToUpdatedAgency2.id,
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
