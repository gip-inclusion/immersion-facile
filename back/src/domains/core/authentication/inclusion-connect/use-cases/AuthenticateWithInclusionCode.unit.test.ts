import { subDays } from "date-fns";
import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  type AuthenticateWithOAuthCodeParams,
  allowedStartOAuthLoginPages,
  type ExternalId,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  type IdToken,
  type SiretDto,
  type UserWithAdminRights,
} from "shared";
import { v4 as uuid } from "uuid";
import { toAgencyWithRights } from "../../../../../utils/agency";
import { generateES256KeyPair } from "../../../../../utils/jwt";
import { makeCreateNewEvent } from "../../../events/ports/EventBus";
import { makeGenerateJwtES256, makeVerifyJwtES256 } from "../../../jwt";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  fakeProviderConfig,
  InMemoryOAuthGateway,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import type { GetAccessTokenPayload } from "../port/OAuthGateway";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

describe("AuthenticateWithInclusionCode use case", () => {
  const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";
  const correctToken = "my-correct-token";

  const { publicKey, privateKey } = generateES256KeyPair();

  const generateEmailAuthCode = makeGenerateJwtES256<"emailAuthCode">(
    privateKey,
    60 * 60, // 1 hour expiration
  );

  const defaultExpectedIcIdTokenPayload: GetAccessTokenPayload = {
    nonce: "nounce",
    sub: "my-user-external-id",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@inclusion.com",
    siret: "12345678901234",
  };

  let uow: InMemoryUnitOfWork;
  let inclusionConnectGateway: InMemoryOAuthGateway;
  let uuidGenerator: TestUuidGenerator;
  let authenticateWithInclusionCode: AuthenticateWithInclusionCode;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    inclusionConnectGateway = new InMemoryOAuthGateway(fakeProviderConfig);
    timeGateway = new CustomTimeGateway();
    const verifyEmailAuthCode = makeVerifyJwtES256<"emailAuthCode">(publicKey);

    authenticateWithInclusionCode = new AuthenticateWithInclusionCode(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway: timeGateway,
        uuidGenerator,
      }),
      inclusionConnectGateway,
      uuidGenerator,
      () => correctToken,
      verifyEmailAuthCode,
      immersionBaseUrl,
      timeGateway,
    );
  });

  describe("With OAuthGateway provider 'proConnect'", () => {
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

          expectToEqual(uow.userRepository.users, [
            {
              id: userId,
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
              email: defaultExpectedIcIdTokenPayload.email,
              proConnect: {
                externalId: defaultExpectedIcIdTokenPayload.sub,
                siret: defaultExpectedIcIdTokenPayload.siret,
              },
              createdAt: timeGateway.now().toISOString(),
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
              usedAt: timeGateway.now(),
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

          expectToEqual(uow.userRepository.users, [alreadyExistingUser]);

          await authenticateWithInclusionCode.execute({
            code: "my-inclusion-code",
            state: initialOngoingOAuth.state,
            page: "agencyDashboard",
          });

          expectToEqual(uow.userRepository.users, [
            {
              ...alreadyExistingUser,
              email: defaultExpectedIcIdTokenPayload.email,
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
            },
          ]);
        });
        it("also work if the existing user was not inclusion connected (no externalId)", async () => {
          const { alreadyExistingUser } =
            addAlreadyExistingAuthenticatedUserInRepo({
              externalId: null,
            });
          const { initialOngoingOAuth } =
            makeSuccessfulAuthenticationConditions({
              email: alreadyExistingUser.email,
            });

          expectToEqual(uow.userRepository.users, [
            {
              ...alreadyExistingUser,
              proConnect: null,
            },
          ]);

          await authenticateWithInclusionCode.execute({
            code: "my-inclusion-code",
            state: initialOngoingOAuth.state,
            page: "agencyDashboard",
          });

          expectToEqual(uow.userRepository.users, [
            {
              id: alreadyExistingUser.id,
              email: alreadyExistingUser.email,
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
              proConnect: {
                externalId: defaultExpectedIcIdTokenPayload.sub,
                siret: defaultExpectedIcIdTokenPayload.siret,
              },
              createdAt: alreadyExistingUser.createdAt,
            },
          ]);
        });

        it("when user change its email on inclusion connect", async () => {
          const externalId = uuid();

          const initialUser: UserWithAdminRights = {
            id: uuid(),
            email: "initial@mail.com",
            proConnect: {
              externalId,
              siret: "0000",
            },
            firstName: "Billy",
            lastName: "Idol",
            createdAt: new Date().toISOString(),
          };

          const previousMigrationUserWithUpdatedEmail: UserWithAdminRights = {
            id: uuid(),
            email: "updated@mail.com",
            proConnect: null,
            firstName: "",
            lastName: "",
            createdAt: new Date().toISOString(),
          };

          uow.userRepository.users = [
            initialUser,
            previousMigrationUserWithUpdatedEmail,
          ];

          const agency1 = toAgencyWithRights(
            new AgencyDtoBuilder().withId(uuid()).build(),
            {
              [initialUser.id]: {
                isNotifiedByEmail: false,
                roles: ["counsellor"],
              },
              [previousMigrationUserWithUpdatedEmail.id]: {
                isNotifiedByEmail: true,
                roles: ["validator"],
              },
            },
          );
          const agency2 = toAgencyWithRights(
            new AgencyDtoBuilder().withId(uuid()).build(),
            {
              [previousMigrationUserWithUpdatedEmail.id]: {
                isNotifiedByEmail: true,
                roles: ["counsellor"],
              },
            },
          );

          uow.agencyRepository.agencies = [agency1, agency2];

          const updatedUser: UserWithAdminRights = {
            id: initialUser.id,
            email: previousMigrationUserWithUpdatedEmail.email,
            firstName: "Martine",
            lastName: "Duflot",
            proConnect: {
              externalId,
              siret: defaultExpectedIcIdTokenPayload.siret,
            },
            createdAt: initialUser.createdAt,
          };

          await authenticateWithInclusionCode.execute({
            code: "my-inclusion-code",
            state: makeSuccessfulAuthenticationConditions({
              email: updatedUser.email,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              sub: externalId,
            }).initialOngoingOAuth.state,
            page: "agencyDashboard",
          });

          expectToEqual(uow.userRepository.users, [updatedUser]);
          expectToEqual(uow.agencyRepository.agencies, [
            {
              ...agency1,
              usersRights: {
                [initialUser.id]: {
                  isNotifiedByEmail: true,
                  roles: ["counsellor", "validator"],
                },
              },
            },
            {
              ...agency2,
              usersRights: {
                [initialUser.id]: {
                  isNotifiedByEmail: true,
                  roles: ["counsellor"],
                },
              },
            },
          ]);
        });

        it("when user select another siret on ProConnect", async () => {
          const externalId: ExternalId = "id";
          const initialUser: UserWithAdminRights = {
            id: uuid(),
            email: "initial@mail.com",
            proConnect: {
              externalId,
              siret: "00000000000000",
            },
            firstName: "Billy",
            lastName: "Idol",
            createdAt: new Date().toISOString(),
          };

          uow.userRepository.users = [initialUser];

          const proConnectSiret: SiretDto = "55555666667777";

          await authenticateWithInclusionCode.execute({
            code: "my-inclusion-code",
            state: makeSuccessfulAuthenticationConditions({
              email: initialUser.email,
              firstName: initialUser.firstName,
              lastName: initialUser.lastName,
              sub: initialUser.proConnect?.externalId,
              siret: proConnectSiret,
            }).initialOngoingOAuth.state,
            page: "agencyDashboard",
          });

          expectToEqual(uow.userRepository.users, [
            {
              ...initialUser,
              proConnect: {
                externalId,
                siret: proConnectSiret,
              },
            },
          ]);
        });
      });

      describe("handle dynamic login pages", () => {
        it.each(allowedStartOAuthLoginPages)(
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
              `${immersionBaseUrl}/${frontRoutes[page]}?token=${correctToken}&firstName=John&lastName=Doe&email=john.doe@inclusion.com&idToken=inclusion-connect-id-token&provider=proConnect`,
            );
          },
        );
      });
    });

    describe("wrong paths", () => {
      const accessToken = "inclusion-access-token";
      const idToken: IdToken = "inclusion-connect-id-token";

      it("rejects the connection if no state match the provided one in DB", async () => {
        inclusionConnectGateway.setAccessTokenResponse({
          expire: 60,
          payload: defaultExpectedIcIdTokenPayload,
          accessToken,
          idToken,
        });

        const params: AuthenticateWithOAuthCodeParams = {
          code: "my-inclusion-code",
          state: "my-state",
          page: "agencyDashboard",
        };
        await expectPromiseToFailWithError(
          authenticateWithInclusionCode.execute(params),
          errors.inclusionConnect.missingOAuth({
            state: params.state,
          }),
        );
      });

      it("should raise a Forbidden error if the nonce does not match", async () => {
        const existingNonce = "existing-nonce";
        const initialOngoingOAuth: OngoingOAuth = {
          provider: "proConnect",
          state: "my-state",
          nonce: existingNonce,
          usedAt: null,
        };
        uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

        inclusionConnectGateway.setAccessTokenResponse({
          expire: 60,
          payload: defaultExpectedIcIdTokenPayload,
          accessToken,
          idToken,
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

  describe("With provider 'email'", () => {
    describe("validate token", () => {
      const initialOngoingOAuth = {
        provider: "email",
        state: "my-state",
        nonce: "nounce", // matches the one in the payload of the token
        email: "my-email@mail.com",
        usedAt: null,
      } satisfies OngoingOAuth;

      beforeEach(() => {
        uow.ongoingOAuthRepository.ongoingOAuths = [{ ...initialOngoingOAuth }];
      });

      it("validate that token is from server", async () => {
        const result = await authenticateWithInclusionCode.execute({
          code: generateEmailAuthCode({ version: 1 }),
          state: initialOngoingOAuth.state,
          page: "admin",
        });
        expectToEqual(result, expect.any(String));
      });

      it("throws if token is NOT from the server", async () => {
        const { privateKey: otherPrivateKey } = generateES256KeyPair();
        const verifyEmailAuthCode =
          makeVerifyJwtES256<"emailAuthCode">(otherPrivateKey);

        authenticateWithInclusionCode = new AuthenticateWithInclusionCode(
          new InMemoryUowPerformer(uow),
          makeCreateNewEvent({
            timeGateway: timeGateway,
            uuidGenerator,
          }),
          inclusionConnectGateway,
          uuidGenerator,
          () => correctToken,
          verifyEmailAuthCode,
          immersionBaseUrl,
          timeGateway,
        );

        await expectPromiseToFailWithError(
          authenticateWithInclusionCode.execute({
            code: generateEmailAuthCode({ version: 1 }),
            state: initialOngoingOAuth.state,
            page: "admin",
          }),
          errors.user.invalidJwt(),
        );
      });

      it("throws if token is outdated", async () => {
        const userId = "new-user-id";
        uuidGenerator.setNextUuid(userId);

        await expectPromiseToFailWithError(
          authenticateWithInclusionCode.execute({
            code: generateEmailAuthCode({
              version: 1,
              exp: subDays(timeGateway.now(), 1).getTime() / 1000,
            }),
            state: initialOngoingOAuth.state,
            page: "admin",
          }),
          errors.user.expiredJwt(),
        );
      });
    });

    describe("handle dynamic login pages", () => {
      it.each(allowedStartOAuthLoginPages)(
        "generates an app token and returns a redirection url which includes token and user data for %s, create user and update onGoingOAuth",
        async (page) => {
          const email = "my-email@mail.com";

          const initialOngoingOAuth = {
            provider: "email",
            state: "my-state",
            nonce: "nounce", // matches the one in the payload of the token
            email,
            usedAt: null,
          } satisfies OngoingOAuth;

          uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

          const userId = "new-user-id";
          uuidGenerator.setNextUuid(userId);

          const redirectedUrl = await authenticateWithInclusionCode.execute({
            code: generateEmailAuthCode({ version: 1 }),
            state: initialOngoingOAuth.state,
            page,
          });

          expectToEqual(uow.userRepository.users, [
            {
              id: userId,
              email,
              createdAt: timeGateway.now().toISOString(),
              firstName: "",
              lastName: "",
              proConnect: null,
            },
          ]);

          expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
            {
              ...initialOngoingOAuth,
              userId,
              usedAt: timeGateway.now(),
            },
          ]);

          expect(redirectedUrl).toBe(
            `${immersionBaseUrl}/${frontRoutes[page]}?token=${correctToken}&firstName=&lastName=&email=${email}&idToken=&provider=email`,
          );
        },
      );
    });
  });

  describe("does not allow reuse of ongoing auth by redirecting to auth page with param alreadyUsedAuthentication true", () => {
    const page = "admin";

    it("email", async () => {
      const initialOngoingOAuth = {
        provider: "email",
        state: "my-state",
        nonce: "nounce", // matches the one in the payload of the token
        email: "toto",
        usedAt: new Date(),
      } satisfies OngoingOAuth;

      uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

      const redirectUrl = await authenticateWithInclusionCode.execute({
        code: "osef",
        state: initialOngoingOAuth.state,
        page: page,
      });

      expectToEqual(
        redirectUrl,
        `${immersionBaseUrl}/${frontRoutes[page]}?alreadyUsedAuthentication=true`,
      );

      expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
        initialOngoingOAuth,
      ]);
      expectToEqual(uow.userRepository.users, []);
    });

    it("proConnect", async () => {
      const initialOngoingOAuth = {
        provider: "proConnect",
        state: "my-state",
        nonce: "nounce", // matches the one in the payload of the token
        usedAt: new Date(),
      } satisfies OngoingOAuth;

      uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

      const redirectUrl = await authenticateWithInclusionCode.execute({
        code: "osef",
        state: initialOngoingOAuth.state,
        page: page,
      });
      expectToEqual(
        redirectUrl,
        `${immersionBaseUrl}/${frontRoutes[page]}?alreadyUsedAuthentication=true`,
      );

      expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
        initialOngoingOAuth,
      ]);
      expectToEqual(uow.userRepository.users, []);
    });
  });

  const makeSuccessfulAuthenticationConditions = (
    params?: Partial<GetAccessTokenPayload>,
  ) => {
    const expectedIcIdTokenPayload = {
      ...defaultExpectedIcIdTokenPayload,
      ...params,
    };
    const initialOngoingOAuth: OngoingOAuth = {
      provider: "proConnect",
      state: "my-state",
      nonce: "nounce", // matches the one in the payload of the token
      usedAt: null,
    };
    uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

    const userId = "new-user-id";
    uuidGenerator.setNextUuid(userId);

    const accessToken = "inclusion-access-token";
    const idToken: IdToken = "inclusion-connect-id-token";
    inclusionConnectGateway.setAccessTokenResponse({
      payload: expectedIcIdTokenPayload,
      accessToken,
      expire: 60,
      idToken,
    });

    return {
      accessToken,
      initialOngoingOAuth: { ...initialOngoingOAuth },
      userId,
    };
  };

  const addAlreadyExistingAuthenticatedUserInRepo = (
    options: { externalId?: string | null } = {},
  ) => {
    const alreadyExistingUser: UserWithAdminRights = {
      id: "already-existing-id",
      email: "johnny-d@gmail.com",
      firstName: "Johnny",
      lastName: "Doe Existing",
      proConnect:
        options.externalId !== null
          ? {
              externalId:
                options.externalId !== undefined
                  ? options.externalId
                  : defaultExpectedIcIdTokenPayload.sub,
              siret: defaultExpectedIcIdTokenPayload.siret,
            }
          : null,
      createdAt: new Date().toISOString(),
    };
    uow.userRepository.users = [alreadyExistingUser];
    return { alreadyExistingUser };
  };
});
