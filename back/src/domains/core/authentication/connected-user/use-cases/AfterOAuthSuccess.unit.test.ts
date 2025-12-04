import { subDays } from "date-fns";
import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  allowedLoginSources,
  type ExternalId,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  type IdToken,
  type OAuthSuccessLoginParams,
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
import { AfterOAuthSuccess } from "./AfterOAuthSuccess";

describe("AfterOAuthSuccessRedirection use case", () => {
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
    email: "john.doe@mail.com",
    siret: "12345678901234",
  };

  let uow: InMemoryUnitOfWork;
  let oAuthGateway: InMemoryOAuthGateway;
  let uuidGenerator: TestUuidGenerator;
  let afterOAuthSuccessRedirection: AfterOAuthSuccess;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    oAuthGateway = new InMemoryOAuthGateway(fakeProviderConfig);
    timeGateway = new CustomTimeGateway();
    const verifyEmailAuthCode = makeVerifyJwtES256<"emailAuthCode">(publicKey);

    afterOAuthSuccessRedirection = new AfterOAuthSuccess(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway: timeGateway,
        uuidGenerator,
      }),
      oAuthGateway,
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
            makeSuccessfulAuthenticationConditions("admin");

          await afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: initialOngoingOAuth.state,
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
              lastLoginAt: timeGateway.now().toISOString(),
            },
          ]);
        });

        it("updates ongoingOAuth with userId, accessToken and externalId", async () => {
          const { accessToken, initialOngoingOAuth, userId } =
            makeSuccessfulAuthenticationConditions("admin");

          await afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: initialOngoingOAuth.state,
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
            makeSuccessfulAuthenticationConditions("admin");

          await afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: initialOngoingOAuth.state,
          });

          expectObjectInArrayToMatch(uow.outboxRepository.events, [
            {
              topic: "UserAuthenticatedSuccessfully",
              payload: {
                userId,
                codeSafir: null,
                triggeredBy: {
                  kind: "connected-user",
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
            makeSuccessfulAuthenticationConditions("admin");
          const { alreadyExistingUser } =
            addAlreadyExistingAuthenticatedUserInRepo();

          expectToEqual(uow.userRepository.users, [alreadyExistingUser]);

          await afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: initialOngoingOAuth.state,
          });

          expectToEqual(uow.userRepository.users, [
            {
              ...alreadyExistingUser,
              email: defaultExpectedIcIdTokenPayload.email,
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
              lastLoginAt: timeGateway.now().toISOString(),
            },
          ]);
        });
        it("also work if the existing user was not connected through oAuth (no externalId)", async () => {
          const { alreadyExistingUser } =
            addAlreadyExistingAuthenticatedUserInRepo({
              externalId: null,
            });
          const { initialOngoingOAuth } =
            makeSuccessfulAuthenticationConditions("agencyDashboard", {
              email: alreadyExistingUser.email,
            });

          expectToEqual(uow.userRepository.users, [
            {
              ...alreadyExistingUser,
              proConnect: null,
            },
          ]);

          await afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: initialOngoingOAuth.state,
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
              lastLoginAt: timeGateway.now().toISOString(),
            },
          ]);
        });

        it("when user change its email on oAuth provider", async () => {
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
            lastLoginAt: timeGateway.now().toISOString(),
          };

          await afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: makeSuccessfulAuthenticationConditions("agencyDashboard", {
              email: updatedUser.email,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              sub: externalId,
            }).initialOngoingOAuth.state,
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

          await afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: makeSuccessfulAuthenticationConditions("agencyDashboard", {
              email: initialUser.email,
              firstName: initialUser.firstName,
              lastName: initialUser.lastName,
              sub: initialUser.proConnect?.externalId,
              siret: proConnectSiret,
            }).initialOngoingOAuth.state,
          });

          expectToEqual(uow.userRepository.users, [
            {
              ...initialUser,
              proConnect: {
                externalId,
                siret: proConnectSiret,
              },
              lastLoginAt: timeGateway.now().toISOString(),
            },
          ]);
        });
      });

      describe("handle dynamic login pages", () => {
        it.each(
          allowedLoginSources,
        )("generates an app token and returns a redirection url which includes token and user data for %s", async (page) => {
          const { initialOngoingOAuth, fromUri } =
            makeSuccessfulAuthenticationConditions(
              `/${page}?discussionId=discussion0`,
            );

          const response = await afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: initialOngoingOAuth.state,
          });

          expectToEqual(response, {
            provider: "proConnect",
            redirectUri: `${immersionBaseUrl}${fromUri}&token=${correctToken}&firstName=John&lastName=Doe&email=john.doe@mail.com&idToken=id-token&provider=proConnect`,
          });
        });
      });
    });

    describe("wrong paths", () => {
      const accessToken = "access-token";
      const idToken: IdToken = "id-token";

      it("rejects the connection if no state match the provided one in DB", async () => {
        oAuthGateway.setAccessTokenResponse({
          expire: 60,
          payload: defaultExpectedIcIdTokenPayload,
          accessToken,
          idToken,
        });

        const params: OAuthSuccessLoginParams = {
          code: "my-code",
          state: "my-state",
        };

        await expectPromiseToFailWithError(
          afterOAuthSuccessRedirection.execute(params),
          errors.auth.missingOAuth({
            state: params.state,
          }),
        );
      });

      it("should raise a Forbidden error if the nonce does not match", async () => {
        const existingNonce = "existing-nonce";
        const initialOngoingOAuth: OngoingOAuth = {
          fromUri: "agencyDashboard",
          provider: "proConnect",
          state: "my-state",
          nonce: existingNonce,
          usedAt: null,
        };
        uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

        oAuthGateway.setAccessTokenResponse({
          expire: 60,
          payload: defaultExpectedIcIdTokenPayload,
          accessToken,
          idToken,
        });

        await expectPromiseToFailWithError(
          afterOAuthSuccessRedirection.execute({
            code: "my-code",
            state: "my-state",
          }),
          errors.auth.nonceMismatch(),
        );
      });
    });
  });

  describe("With provider 'email'", () => {
    describe("validate token", () => {
      const initialOngoingOAuth: OngoingOAuth = {
        fromUri: "/admin",
        provider: "email",
        state: "my-state",
        nonce: "nounce", // matches the one in the payload of the token
        email: "my-email@mail.com",
        usedAt: null,
      };

      beforeEach(() => {
        uow.ongoingOAuthRepository.ongoingOAuths = [{ ...initialOngoingOAuth }];
      });

      it("validate that token is from server", async () => {
        const result = await afterOAuthSuccessRedirection.execute({
          code: generateEmailAuthCode({ version: 1 }),
          state: initialOngoingOAuth.state,
        });
        expectToEqual(result, {
          provider: "email",
          redirectUri: `${immersionBaseUrl}/admin?token=${correctToken}&firstName=&lastName=&email=my-email@mail.com&idToken=&provider=email`,
        });
      });

      it("throws if token is NOT from the server", async () => {
        const { privateKey: otherPrivateKey } = generateES256KeyPair();
        const verifyEmailAuthCode =
          makeVerifyJwtES256<"emailAuthCode">(otherPrivateKey);

        afterOAuthSuccessRedirection = new AfterOAuthSuccess(
          new InMemoryUowPerformer(uow),
          makeCreateNewEvent({
            timeGateway: timeGateway,
            uuidGenerator,
          }),
          oAuthGateway,
          uuidGenerator,
          () => correctToken,
          verifyEmailAuthCode,
          immersionBaseUrl,
          timeGateway,
        );

        await expectPromiseToFailWithError(
          afterOAuthSuccessRedirection.execute({
            code: generateEmailAuthCode({ version: 1 }),
            state: initialOngoingOAuth.state,
          }),
          errors.user.invalidJwt(),
        );
      });

      it("throws if token is outdated", async () => {
        const userId = "new-user-id";
        uuidGenerator.setNextUuid(userId);

        const expirationDate = subDays(timeGateway.now(), 1);

        await expectPromiseToFailWithError(
          afterOAuthSuccessRedirection.execute({
            code: generateEmailAuthCode({
              version: 1,
              exp: subDays(timeGateway.now(), 1).getTime() / 1000,
            }),
            state: initialOngoingOAuth.state,
          }),
          errors.user.expiredJwt(
            (timeGateway.now().getTime() - expirationDate.getTime()) /
              1000 /
              60 +
              " minutes",
          ),
        );
      });
    });

    describe("handle dynamic login pages", () => {
      it.each(
        allowedLoginSources,
      )("generates an app token and returns a redirection url which includes token and user data for %s, create user and update onGoingOAuth", async (page) => {
        const email = "my-email@mail.com";

        const initialOngoingOAuth: OngoingOAuth = {
          fromUri: `/${page}?discussionId=discussion0`,
          provider: "email",
          state: "my-state",
          nonce: "nounce", // matches the one in the payload of the token
          email,
          usedAt: null,
        };

        uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

        const userId = "new-user-id";
        uuidGenerator.setNextUuid(userId);

        const redirectedUrl = await afterOAuthSuccessRedirection.execute({
          code: generateEmailAuthCode({ version: 1 }),
          state: initialOngoingOAuth.state,
        });

        expectToEqual(uow.userRepository.users, [
          {
            id: userId,
            email,
            createdAt: timeGateway.now().toISOString(),
            firstName: "",
            lastName: "",
            proConnect: null,
            lastLoginAt: timeGateway.now().toISOString(),
          },
        ]);

        expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
          {
            ...initialOngoingOAuth,
            userId,
            usedAt: timeGateway.now(),
          },
        ]);

        expectToEqual(redirectedUrl, {
          provider: "email",
          redirectUri: `${immersionBaseUrl}/${page}?discussionId=discussion0&token=${correctToken}&firstName=&lastName=&email=${email}&idToken=&provider=email`,
        });
      });
    });
  });

  describe("does not allow reuse of ongoing auth by redirecting to auth page with param alreadyUsedAuthentication true", () => {
    const redirectUrl = "/admin";

    it("email", async () => {
      const initialOngoingOAuth: OngoingOAuth = {
        fromUri: redirectUrl,
        provider: "email",
        state: "my-state",
        nonce: "nounce", // matches the one in the payload of the token
        email: "toto",
        usedAt: new Date(),
      };

      uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

      expectPromiseToFailWithError(
        afterOAuthSuccessRedirection.execute({
          code: "osef",
          state: initialOngoingOAuth.state,
        }),
        errors.auth.alreadyUsedAuthentication(),
      );
    });

    it("proConnect", async () => {
      const initialOngoingOAuth: OngoingOAuth = {
        fromUri: redirectUrl,
        provider: "proConnect",
        state: "my-state",
        nonce: "nounce", // matches the one in the payload of the token
        usedAt: new Date(),
      };

      uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

      const response = await afterOAuthSuccessRedirection.execute({
        code: "osef",
        state: initialOngoingOAuth.state,
      });

      expectToEqual(response, {
        redirectUri: `${immersionBaseUrl}${redirectUrl}?alreadyUsedAuthentication=true`,
        provider: "proConnect",
      });

      expectToEqual(uow.ongoingOAuthRepository.ongoingOAuths, [
        initialOngoingOAuth,
      ]);
      expectToEqual(uow.userRepository.users, []);
    });
  });

  const makeSuccessfulAuthenticationConditions = (
    fromUri: string,
    params?: Partial<GetAccessTokenPayload>,
  ) => {
    const expectedIcIdTokenPayload = {
      ...defaultExpectedIcIdTokenPayload,
      ...params,
    };
    const initialOngoingOAuth: OngoingOAuth = {
      fromUri,
      provider: "proConnect",
      state: "my-state",
      nonce: "nounce", // matches the one in the payload of the token
      usedAt: null,
    };
    uow.ongoingOAuthRepository.ongoingOAuths = [initialOngoingOAuth];

    const userId = "new-user-id";
    uuidGenerator.setNextUuid(userId);

    const accessToken = "access-token";
    const idToken: IdToken = "id-token";
    oAuthGateway.setAccessTokenResponse({
      payload: expectedIcIdTokenPayload,
      accessToken,
      expire: 60,
      idToken,
    });

    return {
      fromUri,
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
