import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  AuthenticateWithOAuthCodeParams,
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
import {
  InMemoryOAuthGateway,
  fakeInclusionConnectConfig,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import { OAuthIdTokenPayload } from "../entities/OAuthIdTokenPayload";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { OAuthGatewayMode, oAuthGatewayModes } from "../port/OAuthGateway";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";
const correctToken = "my-correct-token";

const defaultExpectedIcIdTokenPayload: OAuthIdTokenPayload = {
  nonce: "nounce",
  sub: "my-user-external-id",
  given_name: "John",
  family_name: "Doe",
  email: "john.doe@inclusion.com",
};

describe("AuthenticateWithInclusionCode use case", () => {
  let uow: InMemoryUnitOfWork;
  let inclusionConnectGateway: InMemoryOAuthGateway;
  let uuidGenerator: TestUuidGenerator;
  let authenticateWithInclusionCode: AuthenticateWithInclusionCode;

  describe.each(oAuthGatewayModes)("With OAuthGateway mode '%s'", (mode) => {
    beforeEach(() => {
      uow = createInMemoryUow();
      uuidGenerator = new TestUuidGenerator();
      const timeGateway = new CustomTimeGateway();
      inclusionConnectGateway = new InMemoryOAuthGateway(
        fakeInclusionConnectConfig,
      );
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
        timeGateway,
      );

      uow.featureFlagRepository.update({
        flagName: "enableProConnect",
        featureFlag: { kind: "boolean", isActive: mode === "ProConnect" },
      });
    });

    describe("right paths", () => {
      describe("when user had never connected before", () => {
        it("saves the user as Authenticated user", async () => {
          const { initialOngoingOAuth, userId } =
            makeSuccessfulAuthenticationConditions(mode);

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
            makeSuccessfulAuthenticationConditions(mode);

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
            makeSuccessfulAuthenticationConditions(mode);

          await authenticateWithInclusionCode.execute({
            code: "my-inclusion-code",
            state: initialOngoingOAuth.state,
            page: "agencyDashboard",
          });

          expectObjectInArrayToMatch(uow.outboxRepository.events, [
            {
              topic: "UserAuthenticatedSuccessfully",
              payload: {
                provider: initialOngoingOAuth.provider,
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
            makeSuccessfulAuthenticationConditions(mode);
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
          const { initialOngoingOAuth } =
            makeSuccessfulAuthenticationConditions(mode, {
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
              {
                agency: agency2,
                isNotifiedByEmail: true,
                roles: ["counsellor"],
              },
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
            state: makeSuccessfulAuthenticationConditions(mode, {
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
              makeSuccessfulAuthenticationConditions(mode);

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
        const params: AuthenticateWithOAuthCodeParams = {
          code: "my-inclusion-code",
          state: "my-state",
          page: "agencyDashboard",
        };
        await expectPromiseToFailWithError(
          authenticateWithInclusionCode.execute(params),
          errors.inclusionConnect.missingOAuth({
            state: params.state,
            identityProvider:
              mode === "InclusionConnect" ? "inclusionConnect" : "proConnect",
          }),
        );
      });

      it("should raise a Forbidden error if the nonce does not match", async () => {
        const existingNonce = "existing-nonce";
        const initialOngoingOAuth: OngoingOAuth = {
          provider: mode === "ProConnect" ? "proConnect" : "inclusionConnect",
          state: "my-state",
          nonce: existingNonce,
        };
        uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

        const accessToken = "inclusion-access-token";

        inclusionConnectGateway.setAccessTokenResponse({
          expire: 60,
          oAuthIdTokenPayload: defaultExpectedIcIdTokenPayload,
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
  });

  const makeSuccessfulAuthenticationConditions = (
    mode: OAuthGatewayMode,
    params?: Partial<OAuthIdTokenPayload>,
  ) => {
    const expectedIcIdTokenPayload = {
      ...defaultExpectedIcIdTokenPayload,
      ...params,
    };
    const initialOngoingOAuth: OngoingOAuth = {
      provider: mode === "InclusionConnect" ? "inclusionConnect" : "proConnect",
      state: "my-state",
      nonce: "nounce", // matches the one in the payload of the token
    };
    uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

    const userId = "new-user-id";
    uuidGenerator.setNextUuid(userId);

    const accessToken = "inclusion-access-token";
    inclusionConnectGateway.setAccessTokenResponse({
      oAuthIdTokenPayload: expectedIcIdTokenPayload,
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
