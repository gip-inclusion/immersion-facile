import {
  AgencyDtoBuilder,
  AuthenticatedUser,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { InMemoryOutboxRepository } from "../../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryAuthenticatedUserRepository } from "../../../../adapters/secondary/InMemoryAuthenticatedUserRepository";
import { InMemoryInclusionConnectedUserRepository } from "../../../../adapters/secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../../core/eventBus/EventBus";
import { RegisterAgencyToInclusionConnectUser } from "./RegisterAgencyToInclusionConnectUser";

const userId = "456";
const agencyId = "123";

const user: AuthenticatedUser = {
  id: userId,
  email: "john.doe@mail.com",
  firstName: "Joe",
  lastName: "Doe",
};

const agency = new AgencyDtoBuilder().withId(agencyId).build();

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
      registerAgencyToInclusionConnectUser.execute({ agencyId }),
      new ForbiddenError("No JWT token provided"),
    );
  });

  it("fails if user does not exist", async () => {
    await expectPromiseToFailWithError(
      registerAgencyToInclusionConnectUser.execute({ agencyId }, { userId }),
      new NotFoundError(`User not found with id: ${userId}`),
    );
  });

  it("fails if agency does not exist", async () => {
    userRepository.users = [user];
    await expectPromiseToFailWithError(
      registerAgencyToInclusionConnectUser.execute({ agencyId }, { userId }),
      new NotFoundError(`Agency not found with id: ${agencyId}`),
    );
  });

  describe("When User and agency exist", () => {
    beforeEach(() => {
      userRepository.users = [user];
      agencyRepository.setAgencies([agency]);
    });

    it("makes the link between user and provided agency id", async () => {
      await registerAgencyToInclusionConnectUser.execute(
        { agencyId },
        { userId },
      );
      const inclusionConnectedUser =
        await inclusionConnectedUserRepository.getById(userId);
      expectToEqual(inclusionConnectedUser, {
        ...user,
        agencyRights: [{ agency, role: "toReview" }],
      });
    });

    it("save an event when registration goes well", async () => {
      await registerAgencyToInclusionConnectUser.execute(
        { agencyId },
        { userId },
      );

      expect(outboxRepository.events).toHaveLength(1);
      expectObjectsToMatch(outboxRepository.events[0], {
        topic: "AgencyRegisteredToInclusionConnectedUser",
        payload: { userId, agencyId },
      });
    });
  });
});
