import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
  User,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
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
  const icUser = new InclusionConnectedUserBuilder().build();

  const updatedUser = new InclusionConnectedUserBuilder()
    .withId("update")
    .withEmail("update@mail.com")
    .buildUser();
  const notUpdatedUser = new InclusionConnectedUserBuilder()
    .withId("not-update")
    .withEmail("not.updated@mail.com")
    .buildUser();
  const updatedAgency = new AgencyDtoBuilder().withId("1").build();
  const agencyRefersToUpdatedAgency1 = new AgencyDtoBuilder()
    .withId("2")
    .withRefersToAgencyId(updatedAgency.id)
    .build();
  const agencyRefersToUpdatedAgency2 = new AgencyDtoBuilder()
    .withId("3")
    .withRefersToAgencyId(updatedAgency.id)
    .build();
  const agencyNotReferingToUpdatedAgency = new AgencyDtoBuilder()
    .withId("4")
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
      const notifiedUser: User = {
        id: "notified-user",
        email: "notified@email.com",
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

      uow.agencyRepository.setAgencies([
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
          [notifiedUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
          [notNotifiedUser.id]: {
            isNotifiedByEmail: false,
            roles: ["validator"],
          },
        }),
        toAgencyWithRights(agencyRefersToUpdatedAgency1, {
          [notUpdatedUser.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
          [notNotifiedUser.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor"],
          },
        }),
        toAgencyWithRights(agencyRefersToUpdatedAgency2, {
          [notUpdatedUser.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        }),
      ]);
      uuidGenerator.setNextUuids(["event1", "event2"]);

      await updateAgencyReferringToUpdatedAgency.execute(
        { agencyId: updatedAgency.id },
        icUser,
      );

      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
          [notifiedUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
          [notNotifiedUser.id]: {
            isNotifiedByEmail: false,
            roles: ["validator"],
          },
        }),
        toAgencyWithRights(agencyRefersToUpdatedAgency1, {
          [notUpdatedUser.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
          [notNotifiedUser.id]: {
            isNotifiedByEmail: false,
            roles: ["counsellor", "validator"],
          },
        }),
        toAgencyWithRights(agencyRefersToUpdatedAgency2, {
          [notUpdatedUser.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
          [notNotifiedUser.id]: {
            isNotifiedByEmail: false,
            roles: ["validator"],
          },
        }),
      ]);

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
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
        toAgencyWithRights(agencyNotReferingToUpdatedAgency, {
          [notUpdatedUser.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        }),
      ]);

      await updateAgencyReferringToUpdatedAgency.execute({
        agencyId: updatedAgency.id,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
        toAgencyWithRights(agencyNotReferingToUpdatedAgency, {
          [notUpdatedUser.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        }),
      ]);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});
