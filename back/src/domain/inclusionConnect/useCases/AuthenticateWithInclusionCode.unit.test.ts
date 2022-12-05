import {
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryInclusionConnectGateway } from "../../../adapters/secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";
import { InMemoryAuthenticatedUserRepository } from "../../../adapters/secondary/InMemoryAuthenticatedUserRepository";
import { InMemoryOngoingOAuthRepository } from "../../../adapters/secondary/InMemoryOngoingOAuthRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { OngoingOAuth } from "../../generic/OAuth/entities/OngoingOAuth";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";
import {
  fakeInclusionIdTokenWithCorrectPayload,
  fakeInclusionPayload,
} from "./fakeInclusionIdTokenWithCorrectPayload";

const correctToken = "my-correct-token";

describe("AuthenticateWithInclusionCode use case", () => {
  let outboxRepo: InMemoryOutboxRepository;
  let uowPerformer: InMemoryUowPerformer;
  let inclusionConnectGateway: InMemoryInclusionConnectGateway;
  let authenticateWithInclusionCode: AuthenticateWithInclusionCode;
  let ongoingOAuthRepository: InMemoryOngoingOAuthRepository;
  let uuidGenerator: TestUuidGenerator;
  let authenticatedUserRepository: InMemoryAuthenticatedUserRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    outboxRepo = uow.outboxRepository;
    ongoingOAuthRepository = uow.ongoingOAuthRepository;
    authenticatedUserRepository = uow.authenticatedUserRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    uuidGenerator = new TestUuidGenerator();
    const clock = new CustomClock();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    inclusionConnectGateway = new InMemoryInclusionConnectGateway();

    authenticateWithInclusionCode = new AuthenticateWithInclusionCode(
      uowPerformer,
      createNewEvent,
      inclusionConnectGateway,
      uuidGenerator,
      () => correctToken,
    );
  });

  it("rejects the connection if no state match the provided one in DB", async () => {
    const params = { code: "my-inclusion-code", state: "my-state" };
    await expectPromiseToFailWithError(
      authenticateWithInclusionCode.execute(params),
      new ForbiddenError("No ongoing OAuth with provided state : my-state"),
    );
  });

  describe("when auth process goes successfully", () => {
    it("saves the user as Authenticated user", async () => {
      const { initialOngoingOAuth, userId } =
        setUpSuccessFulAuthenticationConditions();

      await authenticateWithInclusionCode.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      expect(authenticatedUserRepository.users).toHaveLength(1);
      expectToEqual(authenticatedUserRepository.users[0], {
        id: userId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@inclusion.com",
      });
    });

    it("updates ongoingOAuth with userId and accessToken", async () => {
      const { accessToken, initialOngoingOAuth, userId } =
        setUpSuccessFulAuthenticationConditions();

      await authenticateWithInclusionCode.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      expect(ongoingOAuthRepository.ongoingOAuths).toHaveLength(1);
      expectToEqual(ongoingOAuthRepository.ongoingOAuths[0], {
        ...initialOngoingOAuth,
        accessToken,
        userId,
        externalId: fakeInclusionPayload.sub,
      });
    });

    it("saves UserConnectedSuccessfully event with relevant data", async () => {
      const { initialOngoingOAuth, userId } =
        setUpSuccessFulAuthenticationConditions();

      await authenticateWithInclusionCode.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      expect(outboxRepo.events).toHaveLength(1);
      expectObjectsToMatch(outboxRepo.events[0], {
        topic: "UserAuthenticatedSuccessfully",
        payload: {
          provider: "inclusionConnect",
          userId,
        },
      });
    });

    it("generates an app token and returns it", async () => {
      const { initialOngoingOAuth } = setUpSuccessFulAuthenticationConditions();

      const appToken = await authenticateWithInclusionCode.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      expect(appToken).toBe(correctToken);
    });
  });

  const setUpSuccessFulAuthenticationConditions = () => {
    const initialOngoingOAuth: OngoingOAuth = {
      provider: "inclusionConnect",
      state: "my-state",
      nonce: "my-nonce",
    };
    ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

    const accessToken = "inclusion-access-token";
    inclusionConnectGateway.setAccessTokenResponse({
      access_token: accessToken,
      id_token: fakeInclusionIdTokenWithCorrectPayload,
    });

    const userId = "generated-user-id";
    uuidGenerator.setNextUuid(userId);

    return {
      accessToken,
      initialOngoingOAuth,
      userId,
    };
  };
});
