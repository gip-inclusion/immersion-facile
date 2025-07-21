import {
  AgencyDtoBuilder,
  type ConnectedUser,
  defaultProConnectInfos,
  errors,
  expectArraysToMatch,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeRegisterAgencyToConnectedUser,
  type RegisterAgencyToConnectedUser,
} from "./RegisterAgencyToConnectedUser";

describe("RegisterAgencyToConnectedUser use case", () => {
  const user: ConnectedUser = {
    id: "456",
    email: "john.doe@mail.com",
    firstName: "Joe",
    lastName: "Doe",
    proConnect: defaultProConnectInfos,
    createdAt: new Date().toISOString(),
    agencyRights: [],
    dashboards: {
      agencies: {},
      establishments: {},
    },
  };

  const agency1 = new AgencyDtoBuilder().withId("agency-111").build();
  const agency2 = new AgencyDtoBuilder().withId("agency-222").build();

  let registerAgencyToConnectedUser: RegisterAgencyToConnectedUser;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    registerAgencyToConnectedUser = makeRegisterAgencyToConnectedUser({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({
          timeGateway: new CustomTimeGateway(),
          uuidGenerator: new TestUuidGenerator(),
        }),
      },
    });
  });

  describe("Wrong path", () => {
    it("fails if no agency exist", async () => {
      uow.userRepository.users = [user];
      await expectPromiseToFailWithError(
        registerAgencyToConnectedUser.execute([agency1.id], user),
        errors.agencies.notFound({ missingAgencyIds: [agency1.id] }),
      );
    });

    it("fails if user already has agency rights for agency", async () => {
      uow.userRepository.users = [user];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {
          [user.id]: { roles: ["counsellor"], isNotifiedByEmail: false },
        }),
      ];

      await expectPromiseToFailWithError(
        registerAgencyToConnectedUser.execute([agency1.id], user),
        errors.user.alreadyHaveAgencyRights({ userId: user.id }),
      );
    });
  });

  describe("When User and agencies exist", () => {
    beforeEach(() => {
      uow.userRepository.users = [user];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {}),
        toAgencyWithRights(agency2, {}),
      ];
    });

    it("makes the link between user and provided agency id, and saves the corresponding event", async () => {
      await registerAgencyToConnectedUser.execute([agency1.id], user);

      expectToEqual(await uow.userRepository.users, [user]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(agency1, {
          [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(agency2, {}),
      ]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "AgencyRegisteredToConnectedUser",
          payload: {
            userId: user.id,
            agencyIds: [agency1.id],
            triggeredBy: { kind: "connected-user", userId: user.id },
          },
        },
      ]);
    });

    it("can register to another agency", async () => {
      uow.userRepository.users = [user];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {
          [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(agency2, {}),
      ];

      await registerAgencyToConnectedUser.execute([agency2.id], user);

      expectToEqual(uow.userRepository.users, [user]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(agency1, {
          [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(agency2, {
          [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
      ]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "AgencyRegisteredToConnectedUser",
          payload: {
            userId: user.id,
            agencyIds: [agency2.id],
            triggeredBy: { kind: "connected-user", userId: user.id },
          },
        },
      ]);
    });

    it("makes the links with all the given agencies, and events has all relevant ids", async () => {
      await registerAgencyToConnectedUser.execute(
        [agency1.id, agency2.id],
        user,
      );

      expectToEqual(await uow.userRepository.users, [user]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(agency1, {
          [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(agency2, {
          [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
      ]);
      expect(uow.outboxRepository.events).toHaveLength(1);
      expectObjectsToMatch(uow.outboxRepository.events[0], {
        topic: "AgencyRegisteredToConnectedUser",
        payload: {
          userId: user.id,
          agencyIds: [agency1.id, agency2.id],
          triggeredBy: { kind: "connected-user", userId: user.id },
        },
      });
    });
  });
});
