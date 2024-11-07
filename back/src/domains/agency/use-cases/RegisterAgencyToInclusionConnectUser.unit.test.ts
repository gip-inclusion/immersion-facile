import {
  AgencyDtoBuilder,
  User,
  errors,
  expectArraysToMatch,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { RegisterAgencyToInclusionConnectUser } from "./RegisterAgencyToInclusionConnectUser";

describe("RegisterAgencyToInclusionConnectUser use case", () => {
  const user: User = {
    id: "456",
    email: "john.doe@mail.com",
    firstName: "Joe",
    lastName: "Doe",
    externalId: "john-external-id",
    createdAt: new Date().toISOString(),
  };

  const agency1 = new AgencyDtoBuilder().withId("agency-111").build();
  const agency2 = new AgencyDtoBuilder().withId("agency-222").build();

  let registerAgencyToInclusionConnectUser: RegisterAgencyToInclusionConnectUser;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    registerAgencyToInclusionConnectUser =
      new RegisterAgencyToInclusionConnectUser(
        new InMemoryUowPerformer(uow),
        makeCreateNewEvent({
          timeGateway: new CustomTimeGateway(),
          uuidGenerator: new TestUuidGenerator(),
        }),
      );
  });

  describe("Wrong path", () => {
    it("fails if no Jwt Token provided", async () => {
      await expectPromiseToFailWithError(
        registerAgencyToInclusionConnectUser.execute([agency1.id]),
        errors.user.noJwtProvided(),
      );
    });

    it("fails if user does not exist", async () => {
      await expectPromiseToFailWithError(
        registerAgencyToInclusionConnectUser.execute([agency1.id], {
          userId: user.id,
        }),
        errors.user.notFound({ userId: user.id }),
      );
    });

    it("fails if no agency exist", async () => {
      uow.userRepository.users = [user];
      await expectPromiseToFailWithError(
        registerAgencyToInclusionConnectUser.execute([agency1.id], {
          userId: user.id,
        }),
        errors.agencies.notFound({ missingAgencyIds: [agency1.id] }),
      );
    });

    it("fails if user already has agency rights", async () => {
      uow.userRepository.users = [user];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {
          [user.id]: { roles: ["counsellor"], isNotifiedByEmail: false },
        }),
      ];

      await expectPromiseToFailWithError(
        registerAgencyToInclusionConnectUser.execute([agency1.id], {
          userId: user.id,
        }),
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
      await registerAgencyToInclusionConnectUser.execute([agency1.id], {
        userId: user.id,
      });

      expectToEqual(await uow.userRepository.users, [user]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(agency1, {
          [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
        toAgencyWithRights(agency2, {}),
      ]);
      expectArraysToMatch(uow.outboxRepository.events, [
        {
          topic: "AgencyRegisteredToInclusionConnectedUser",
          payload: {
            userId: user.id,
            agencyIds: [agency1.id],
            triggeredBy: { kind: "inclusion-connected", userId: user.id },
          },
        },
      ]);
    });

    it("makes the links with all the given agencies, and events has all relevant ids", async () => {
      await registerAgencyToInclusionConnectUser.execute(
        [agency1.id, agency2.id],
        {
          userId: user.id,
        },
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
        topic: "AgencyRegisteredToInclusionConnectedUser",
        payload: {
          userId: user.id,
          agencyIds: [agency1.id, agency2.id],
          triggeredBy: { kind: "inclusion-connected", userId: user.id },
        },
      });
    });
  });
});
