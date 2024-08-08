import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  AuthenticateWithInclusionCodeConnectParams,
  User,
  allowedStartInclusionConnectLoginPages,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import { v4 as uuid } from "uuid";
import { makeCreateNewEvent } from "../../../events/ports/EventBus";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import { InMemoryInclusionConnectGateway } from "../adapters/Inclusion-connect-gateway/InMemoryInclusionConnectGateway";
import { InclusionConnectIdTokenPayload } from "../entities/InclusionConnectIdTokenPayload";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";
const correctToken = "my-correct-token";
const clientId = "my-client-id";
const clientSecret = "my-client-secret";
const scope = "openid profile email";

const inclusionConnectBaseUri: AbsoluteUrl =
  "http://fake-inclusion-connect-uri.com";

const defaultExpectedIcIdTokenPayload: InclusionConnectIdTokenPayload = {
  nonce: "nounce",
  sub: "my-user-external-id",
  given_name: "John",
  family_name: "Doe",
  email: "john.doe@inclusion.com",
};

describe("AuthenticateWithInclusionCode use case", () => {
  let uow: InMemoryUnitOfWork;
  let inclusionConnectGateway: InMemoryInclusionConnectGateway;
  let uuidGenerator: TestUuidGenerator;
  let authenticateWithInclusionCode: AuthenticateWithInclusionCode;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    const timeGateway = new CustomTimeGateway();
    inclusionConnectGateway = new InMemoryInclusionConnectGateway();
    const immersionBaseUri: AbsoluteUrl = "http://immersion-uri.com";
    const immersionRedirectUri: AbsoluteUrl = `${immersionBaseUri}/my-redirection`;
    authenticateWithInclusionCode = new AuthenticateWithInclusionCode(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway: new CustomTimeGateway(),
        uuidGenerator,
      }),
      inclusionConnectGateway,
      uuidGenerator,
      () => correctToken,
      immersionBaseUrl,
      {
        immersionRedirectUri,
        inclusionConnectBaseUri,
        scope,
        clientId,
        clientSecret,
      },
      timeGateway,
    );
  });

  describe("right paths", () => {
    describe("when user had never connected before", () => {
      it("saves the user as Authenticated user", async () => {
        const { initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions();

        await authenticateWithInclusionCode.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectObjectInArrayToMatch(uow.userRepository.users, [
          {
            id: userId,
            firstName: defaultExpectedIcIdTokenPayload.given_name,
            lastName: defaultExpectedIcIdTokenPayload.family_name,
            email: defaultExpectedIcIdTokenPayload.email,
            externalId: defaultExpectedIcIdTokenPayload.sub,
          },
        ]);
      });

      it("updates ongoingOAuth with userId, accessToken and externalId", async () => {
        const { accessToken, initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions();

        await authenticateWithInclusionCode.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
          {
            ...initialOngoingOAuth,
            accessToken,
            userId,
            externalId: defaultExpectedIcIdTokenPayload.sub,
          },
        ]);
      });

      it("saves UserConnectedSuccessfully event with relevant data", async () => {
        const { initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions();

        await authenticateWithInclusionCode.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          {
            topic: "UserAuthenticatedSuccessfully",
            payload: {
              provider: "inclusionConnect",
              userId,
              codeSafir: null,
              triggeredBy: {
                kind: "inclusion-connected",
                userId,
              },
            },
          },
        ]);
      });
    });

    describe("when user has already exists as an Authenticated User", () => {
      it("updates the user as Authenticated user", async () => {
        const { initialOngoingOAuth } =
          makeSuccessfulAuthenticationConditions();
        const { alreadyExistingUser } =
          addAlreadyExistingAuthenticatedUserInRepo();

        expectObjectInArrayToMatch(uow.userRepository.users, [
          {
            id: alreadyExistingUser.id,
            email: alreadyExistingUser.email,
            firstName: alreadyExistingUser.firstName,
            lastName: alreadyExistingUser.lastName,
            externalId: alreadyExistingUser.externalId,
          },
        ]);

        await authenticateWithInclusionCode.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectObjectInArrayToMatch(uow.userRepository.users, [
          {
            id: alreadyExistingUser.id,
            email: defaultExpectedIcIdTokenPayload.email,
            firstName: defaultExpectedIcIdTokenPayload.given_name,
            lastName: defaultExpectedIcIdTokenPayload.family_name,
            externalId: alreadyExistingUser.externalId,
          },
        ]);
      });
      it("also work if the existing user was not inclusion connected (no externalId)", async () => {
        const { alreadyExistingUser } =
          addAlreadyExistingAuthenticatedUserInRepo({
            externalId: null,
          });
        const { initialOngoingOAuth } = makeSuccessfulAuthenticationConditions({
          email: alreadyExistingUser.email,
        });

        expectObjectInArrayToMatch(uow.userRepository.users, [
          {
            id: alreadyExistingUser.id,
            email: alreadyExistingUser.email,
            firstName: alreadyExistingUser.firstName,
            lastName: alreadyExistingUser.lastName,
            externalId: null,
          },
        ]);

        await authenticateWithInclusionCode.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectObjectInArrayToMatch(uow.userRepository.users, [
          {
            id: alreadyExistingUser.id,
            email: alreadyExistingUser.email,
            firstName: defaultExpectedIcIdTokenPayload.given_name,
            lastName: defaultExpectedIcIdTokenPayload.family_name,
            externalId: defaultExpectedIcIdTokenPayload.sub,
          },
        ]);
      });

      it("when user change its email on inclusion connect", async () => {
        const externalId = uuid();

        const initialUser: User = {
          id: uuid(),
          email: "initial@mail.com",
          externalId,
          firstName: "Billy",
          lastName: "Idol",
          createdAt: new Date().toISOString(),
        };

        const previousMigrationUserWithUpdatedEmail: User = {
          id: uuid(),
          email: "updated@mail.com",
          externalId: null,
          firstName: "",
          lastName: "",
          createdAt: new Date().toISOString(),
        };

        uow.userRepository.users = [
          initialUser,
          previousMigrationUserWithUpdatedEmail,
        ];

        const agency1 = new AgencyDtoBuilder().withId(uuid()).build();
        const agency2 = new AgencyDtoBuilder().withId(uuid()).build();

        uow.userRepository.agencyRightsByUserId = {
          [initialUser.id]: [
            {
              agency: agency1,
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
          ],
          [previousMigrationUserWithUpdatedEmail.id]: [
            {
              agency: agency1,
              isNotifiedByEmail: true,
              roles: ["validator"],
            },
            { agency: agency2, isNotifiedByEmail: true, roles: ["counsellor"] },
          ],
        };

        const updatedUser: User = {
          id: initialUser.id,
          email: previousMigrationUserWithUpdatedEmail.email,
          firstName: "Martine",
          lastName: "Duflot",
          externalId,
          createdAt: initialUser.createdAt,
        };

        await authenticateWithInclusionCode.execute({
          code: "my-inclusion-code",
          state: makeSuccessfulAuthenticationConditions({
            email: updatedUser.email,
            family_name: updatedUser.lastName,
            given_name: updatedUser.firstName,
            sub: externalId,
          }).initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectObjectInArrayToMatch(uow.userRepository.users, [updatedUser]);
        expectToEqual(uow.userRepository.agencyRightsByUserId, {
          [initialUser.id]: [
            {
              agency: agency1,
              isNotifiedByEmail: true,
              roles: ["counsellor", "validator"],
            },
            {
              agency: agency2,
              isNotifiedByEmail: true,
              roles: ["counsellor"],
            },
          ],
        });
      });
    });

    describe("handle dynamic login pages", () => {
      it.each(allowedStartInclusionConnectLoginPages)(
        "generates an app token and returns a redirection url which includes token and user data for %s",
        async (page) => {
          const { initialOngoingOAuth } =
            makeSuccessfulAuthenticationConditions();

          const redirectedUrl = await authenticateWithInclusionCode.execute({
            code: "my-inclusion-code",
            state: initialOngoingOAuth.state,
            page,
          });

          expect(redirectedUrl).toBe(
            `${immersionBaseUrl}/${frontRoutes[page]}?token=${correctToken}&firstName=John&lastName=Doe&email=john.doe@inclusion.com`,
          );
        },
      );
    });
  });

  describe("wrong paths", () => {
    it("rejects the connection if no state match the provided one in DB", async () => {
      const params: AuthenticateWithInclusionCodeConnectParams = {
        code: "my-inclusion-code",
        state: "my-state",
        page: "agencyDashboard",
      };
      await expectPromiseToFailWithError(
        authenticateWithInclusionCode.execute(params),
        errors.inclusionConnect.missingOAuth({ state: params.state }),
      );
    });

    it("should raise a Forbidden error if the nonce does not match", async () => {
      const existingNonce = "existing-nonce";
      const initialOngoingOAuth: OngoingOAuth = {
        provider: "inclusionConnect",
        state: "my-state",
        nonce: existingNonce,
      };
      uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

      const accessToken = "inclusion-access-token";

      inclusionConnectGateway.setAccessTokenResponse({
        expire: 60,
        icIdTokenPayload: defaultExpectedIcIdTokenPayload,
        accessToken,
      });

      await expectPromiseToFailWithError(
        authenticateWithInclusionCode.execute({
          code: "my-inclusion-code",
          state: "my-state",
          page: "agencyDashboard",
        }),
        errors.inclusionConnect.nonceMismatch(),
      );
    });
  });

  const makeSuccessfulAuthenticationConditions = (
    params?: Partial<InclusionConnectIdTokenPayload>,
  ) => {
    const expectedIcIdTokenPayload = {
      ...defaultExpectedIcIdTokenPayload,
      ...params,
    };
    const initialOngoingOAuth: OngoingOAuth = {
      provider: "inclusionConnect",
      state: "my-state",
      nonce: "nounce", // matches the one in the payload of the token
    };
    uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

    const userId = "new-user-id";
    uuidGenerator.setNextUuid(userId);

    const accessToken = "inclusion-access-token";
    inclusionConnectGateway.setAccessTokenResponse({
      icIdTokenPayload: expectedIcIdTokenPayload,
      accessToken,
      expire: 60,
    });

    return {
      accessToken,
      initialOngoingOAuth,
      userId,
    };
  };

  const addAlreadyExistingAuthenticatedUserInRepo = (
    options: {
      externalId?: string | null;
    } = {},
  ) => {
    const alreadyExistingUser: User = {
      id: "already-existing-id",
      email: "johnny-d@gmail.com",
      firstName: "Johnny",
      lastName: "Doe Existing",
      externalId:
        options.externalId !== undefined
          ? options.externalId
          : defaultExpectedIcIdTokenPayload.sub,
      createdAt: new Date().toISOString(),
    };
    uow.userRepository.users = [alreadyExistingUser];
    return { alreadyExistingUser };
  };
});
