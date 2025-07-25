import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeUpdateAgencyReferringToUpdatedAgency,
  type UpdateAgencyReferringToUpdatedAgency,
} from "./UpdateAgencyReferringToUpdatedAgency";

describe("UpdateAgencyReferingToUpdatedAgency", () => {
  const updatedUser = new ConnectedUserBuilder()
    .withId("updated-user")
    .withEmail("update@mail.com")
    .buildUser();
  const notUpdatedUser = new ConnectedUserBuilder()
    .withId("not-updated-user")
    .withEmail("not.updated@mail.com")
    .buildUser();

  const notImpactedAgency = new AgencyDtoBuilder()
    .withId("not-impacted-agency")
    .withName("Agency not impacted by the usecase")
    // .withValidatorEmails(["update@mail.com"])
    .build();
  const updatedAgency = new AgencyDtoBuilder()
    .withId("updated-agency-1")
    .withName("Agency 1 (updated)")
    // .withValidatorEmails(["update@mail.com"])
    .build();
  const agency2RefersToUpdatedAgency = new AgencyDtoBuilder()
    .withId("agency2-refers-to-agency-1")
    .withName("Structure accompagnement 2 referent à l'agence 1")
    // .withValidatorEmails(["not.updated@mail.com"])
    .withRefersToAgencyInfo({
      refersToAgencyId: updatedAgency.id,
      refersToAgencyName: updatedAgency.name,
    })
    .build();
  const agency3RefersToUpdatedAgency = new AgencyDtoBuilder()
    .withId("agency3-refers-to-agency-1")
    .withName("Structure accompagnement 3 referent à l'agence 1")
    // .withValidatorEmails(["not.updated@mail.com"])
    .withRefersToAgencyInfo({
      refersToAgencyId: updatedAgency.id,
      refersToAgencyName: updatedAgency.name,
    })
    .build();
  const agencyNotReferingToUpdatedAgency = new AgencyDtoBuilder()
    .withId("agency4-not-refers-to-agency-1")
    .withName("Agency 4")
    // .withValidatorEmails(["not.updated@mail.com"])
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
      makeUpdateAgencyReferringToUpdatedAgency({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          createNewEvent,
        },
      });
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
      uuidGenerator.setNextUuids(["event1", "event2"]);
      uow.userRepository.users = [updatedUser, notUpdatedUser];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(notImpactedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: true },
          [notUpdatedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
        toAgencyWithRights(agency2RefersToUpdatedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: false },
          [notUpdatedUser.id]: {
            roles: ["counsellor", "validator"],
            isNotifiedByEmail: false,
          },
        }),
        toAgencyWithRights(agency3RefersToUpdatedAgency, {
          [notUpdatedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];

      await updateAgencyReferringToUpdatedAgency.execute({
        agencyId: updatedAgency.id,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(notImpactedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: true },
          [notUpdatedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
        toAgencyWithRights(agency2RefersToUpdatedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: true },
          [notUpdatedUser.id]: {
            roles: ["counsellor", "validator"],
            isNotifiedByEmail: false,
          },
        }),
        toAgencyWithRights(agency3RefersToUpdatedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: true },
          [notUpdatedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ]);

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

    it("Remove the validator from agencies that refers to when it's role change from validator to an other one", async () => {
      uuidGenerator.setNextUuids(["event1", "event2"]);
      uow.userRepository.users = [updatedUser, notUpdatedUser];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(notImpactedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { roles: ["counsellor"], isNotifiedByEmail: true },
          [notUpdatedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
        toAgencyWithRights(agency2RefersToUpdatedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: false },
          [notUpdatedUser.id]: {
            roles: ["counsellor", "validator"],
            isNotifiedByEmail: false,
          },
        }),
        toAgencyWithRights(agency3RefersToUpdatedAgency, {
          [notUpdatedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];

      await updateAgencyReferringToUpdatedAgency.execute({
        agencyId: updatedAgency.id,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(notImpactedAgency, {
          [updatedUser.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { roles: ["counsellor"], isNotifiedByEmail: true },
          [notUpdatedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
        toAgencyWithRights(agency2RefersToUpdatedAgency, {
          [notUpdatedUser.id]: {
            roles: ["counsellor", "validator"],
            isNotifiedByEmail: false,
          },
        }),
        toAgencyWithRights(agency3RefersToUpdatedAgency, {
          [notUpdatedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ]);

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
      uow.agencyRepository.agencies = [
        toAgencyWithRights(updatedAgency, {
          [updatedUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
        toAgencyWithRights(agencyNotReferingToUpdatedAgency, {
          [notUpdatedUser.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        }),
      ];

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
