import {
  AgencyDtoBuilder,
  AuthenticatedUser,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { InMemoryAuthenticatedUserRepository } from "../../core/authentication/inclusion-connect/adapters/InMemoryAuthenticatedUserRepository";
import { InMemoryInclusionConnectedUserRepository } from "../../core/authentication/inclusion-connect/adapters/InMemoryInclusionConnectedUserRepository";
import { InMemoryOutboxRepository } from "../../core/events/adapters/InMemoryOutboxRepository";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../adapters/InMemoryAgencyRepository";
import { someAgenciesMissingMessage } from "../ports/AgencyRepository";
import { RegisterAgencyToInclusionConnectUser } from "./RegisterAgencyToInclusionConnectUser";

const userId = "456";
const agencyId1 = "agency-111";
const agencyId2 = "agency-222";

const user: AuthenticatedUser = {
  id: userId,
  email: "john.doe@mail.com",
  firstName: "Joe",
  lastName: "Doe",
  externalId: "john-external-id",
};

const agency1 = new AgencyDtoBuilder().withId(agencyId1).build();
const agency2 = new AgencyDtoBuilder().withId(agencyId2).build();

describe("RegisterAgencyToInclusionConnectUser use case", () => {
  let registerAgencyToInclusionConnectUser: RegisterAgencyToInclusionConnectUser;
  let uowPerformer: InMemoryUowPerformer;
  let userRepository: InMemoryAuthenticatedUserRepository;
  let agencyRepository: InMemoryAgencyRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let inclusionConnectedUserRepository: InMemoryInclusionConnectedUserRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    userRepository = uow.authenticatedUserRepository;
    agencyRepository = uow.agencyRepository;
    inclusionConnectedUserRepository = uow.inclusionConnectedUserRepository;
    outboxRepository = uow.outboxRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    const createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator: new TestUuidGenerator(),
    });
    registerAgencyToInclusionConnectUser =
      new RegisterAgencyToInclusionConnectUser(uowPerformer, createNewEvent);
  });

  it("fails if no Jwt Token provided", async () => {
    await expectPromiseToFailWithError(
      registerAgencyToInclusionConnectUser.execute([agencyId1]),
      new ForbiddenError("No JWT token provided"),
    );
  });

  it("fails if user does not exist", async () => {
    await expectPromiseToFailWithError(
      registerAgencyToInclusionConnectUser.execute([agencyId1], { userId }),
      new NotFoundError(`User not found with id: ${userId}`),
    );
  });

  it("fails if no agency exist", async () => {
    userRepository.users = [user];
    await expectPromiseToFailWithError(
      registerAgencyToInclusionConnectUser.execute([agencyId1], { userId }),
      new NotFoundError(someAgenciesMissingMessage([agencyId1])),
    );
  });

  it("fails if user already has agency rights", async () => {
    agencyRepository.setAgencies([agency1]);
    inclusionConnectedUserRepository.setInclusionConnectedUsers([
      {
        ...user,
        agencyRights: [{ agency: agency1, role: "counsellor" }],
        establishmentDashboards: {},
      },
    ]);
    await expectPromiseToFailWithError(
      registerAgencyToInclusionConnectUser.execute([agency1.id], { userId }),
      new BadRequestError(
        `This user (userId: ${userId}), already has agencies rights.`,
      ),
    );
  });

  describe("When User and agencies exist", () => {
    beforeEach(() => {
      userRepository.users = [user];
      agencyRepository.setAgencies([agency1, agency2]);
    });

    it("makes the link between user and provided agency id, and saves the corresponding event", async () => {
      await registerAgencyToInclusionConnectUser.execute([agencyId1], {
        userId,
      });

      const inclusionConnectedUser =
        await inclusionConnectedUserRepository.getById(userId);

      expectToEqual(inclusionConnectedUser, {
        ...user,
        agencyRights: [{ agency: agency1, role: "toReview" }],
        establishmentDashboards: {},
      });
      expect(outboxRepository.events).toHaveLength(1);
      expectObjectsToMatch(outboxRepository.events[0], {
        topic: "AgencyRegisteredToInclusionConnectedUser",
        payload: { userId, agencyIds: [agencyId1] },
      });
    });

    it("makes the links with all the given agencies, and events has all relevant ids", async () => {
      await registerAgencyToInclusionConnectUser.execute(
        [agencyId1, agencyId2],
        {
          userId,
        },
      );

      const inclusionConnectedUser =
        await inclusionConnectedUserRepository.getById(userId);

      expectToEqual(inclusionConnectedUser, {
        ...user,
        agencyRights: [
          { agency: agency1, role: "toReview" },
          { agency: agency2, role: "toReview" },
        ],
        establishmentDashboards: {},
      });
      expect(outboxRepository.events).toHaveLength(1);
      expectObjectsToMatch(outboxRepository.events[0], {
        topic: "AgencyRegisteredToInclusionConnectedUser",
        payload: { userId, agencyIds: [agencyId1, agencyId2] },
      });
    });
  });
});
