import {
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import {
  prepareNextUuid,
  TestUuidGenerator,
} from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  fakeInclusionPayload,
  InMemoryInclusionConnectGateway,
  prepareAccessToken,
} from "../../../adapters/secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";
import { prepareOngoingOAuth } from "../../../adapters/secondary/InMemoryOngoingOAuthRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

const correctToken = "my-correct-token";

describe("AuthenticateWithInclusionCode use case", () => {
  let uow: InMemoryUnitOfWork;
  let inclusionConnectGateway: InMemoryInclusionConnectGateway;
  let uuidGenerator: TestUuidGenerator;
  let useCase: AuthenticateWithInclusionCode;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    inclusionConnectGateway = new InMemoryInclusionConnectGateway();
    useCase = new AuthenticateWithInclusionCode(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway: new CustomTimeGateway(),
        uuidGenerator,
      }),
      inclusionConnectGateway,
      uuidGenerator,
      () => correctToken,
    );
  });

  it("rejects the connection if no state match the provided one in DB", async () => {
    const params = { code: "my-inclusion-code", state: "my-state" };
    await expectPromiseToFailWithError(
      useCase.execute(params),
      new ForbiddenError("No ongoing OAuth with provided state : my-state"),
    );
  });

  describe("when auth process goes successfully", () => {
    it("saves the user as Authenticated user", async () => {
      const { initialOngoingOAuth, userId } =
        makeSuccessfulAuthenticationConditions();

      await useCase.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      expect(uow.authenticatedUserRepository.users).toHaveLength(1);
      expectToEqual(uow.authenticatedUserRepository.users[0], {
        id: userId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@inclusion.com",
      });
    });

    it("updates ongoingOAuth with userId and accessToken", async () => {
      const { accessToken, initialOngoingOAuth, userId } =
        makeSuccessfulAuthenticationConditions();

      await useCase.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      expect(uow.ongoingOAuthRepository.ongoingOAuths).toHaveLength(1);
      expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths[0], {
        ...initialOngoingOAuth,
        accessToken,
        userId,
        externalId: fakeInclusionPayload.sub,
      });
    });

    it("saves UserConnectedSuccessfully event with relevant data", async () => {
      const { initialOngoingOAuth, userId } =
        makeSuccessfulAuthenticationConditions();

      await useCase.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      expect(uow.outboxRepository.events).toHaveLength(1);
      expectObjectsToMatch(uow.outboxRepository.events[0], {
        topic: "UserAuthenticatedSuccessfully",
        payload: {
          provider: "inclusionConnect",
          userId,
        },
      });
    });

    it("generates an app token and returns it", async () => {
      const { initialOngoingOAuth } = makeSuccessfulAuthenticationConditions();

      const appToken = await useCase.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      expect(appToken).toBe(correctToken);
    });
  });
  const makeSuccessfulAuthenticationConditions = () => ({
    accessToken: prepareAccessToken(
      inclusionConnectGateway,
      "inclusion-access-token",
    ),
    initialOngoingOAuth: prepareOngoingOAuth(uow.ongoingOAuthRepository, {
      provider: "inclusionConnect",
      state: "my-state",
      nonce: "my-nonce",
    }),
    userId: prepareNextUuid(uuidGenerator, "generated-user-id"),
  });
});
