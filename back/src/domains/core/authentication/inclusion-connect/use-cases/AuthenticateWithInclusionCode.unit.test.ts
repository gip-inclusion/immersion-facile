import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  type AuthenticateWithOAuthCodeParams,
  type IdToken,
  allowedStartOAuthLoginPages,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import { v4 as uuid } from "uuid";
import { toAgencyWithRights } from "../../../../../utils/agency";
import { makeCreateNewEvent } from "../../../events/ports/EventBus";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  InMemoryOAuthGateway,
  fakeProviderConfig,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import type { GetAccessTokenPayload } from "../port/OAuthGateway";
import type { UserOnRepository } from "../port/UserRepository";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

describe("AuthenticateWithInclusionCode use case", () => {
  const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";
  const correctToken = "my-correct-token";

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

  describe("With OAuthGateway provider 'proConnect'", () => {
    beforeEach(() => {
      uow = createInMemoryUow();
      uuidGenerator = new TestUuidGenerator();
      const timeGateway = new CustomTimeGateway();
      inclusionConnectGateway = new InMemoryOAuthGateway(fakeProviderConfig);
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
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
              email: defaultExpectedIcIdTokenPayload.email,
              proConnect: {
                externalId: defaultExpectedIcIdTokenPayload.sub,
                siret: defaultExpectedIcIdTokenPayload.siret,
              },
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
            makeSuccessfulAuthenticationConditions();
          const { alreadyExistingUser } =
            addAlreadyExistingAuthenticatedUserInRepo();

          expectObjectInArrayToMatch(uow.userRepository.users, [
            {
              id: alreadyExistingUser.id,
              email: alreadyExistingUser.email,
              firstName: alreadyExistingUser.firstName,
              lastName: alreadyExistingUser.lastName,
              proConnect: alreadyExistingUser.proConnect,
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
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
              proConnect: alreadyExistingUser.proConnect,
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

          expectObjectInArrayToMatch(uow.userRepository.users, [
            {
              id: alreadyExistingUser.id,
              email: alreadyExistingUser.email,
              firstName: alreadyExistingUser.firstName,
              lastName: alreadyExistingUser.lastName,
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
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
              proConnect: {
                externalId: defaultExpectedIcIdTokenPayload.sub,
                siret: defaultExpectedIcIdTokenPayload.siret,
              },
            },
          ]);
        });

        it("when user change its email on inclusion connect", async () => {
          const externalId = uuid();

          const initialUser: UserOnRepository = {
            id: uuid(),
            email: "initial@mail.com",
            firstName: "Billy",
            lastName: "Idol",
            createdAt: new Date().toISOString(),
            proConnect: {
              externalId,
              siret: "0000",
            },
          };

          const previousMigrationUserWithUpdatedEmail: UserOnRepository = {
            id: uuid(),
            email: "updated@mail.com",
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

          const updatedUser: UserOnRepository = {
            id: initialUser.id,
            email: previousMigrationUserWithUpdatedEmail.email,
            firstName: "Martine",
            lastName: "Duflot",

            createdAt: initialUser.createdAt,
            proConnect: {
              externalId,
              siret: "",
            },
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

          expectToEqual(uow.userRepository.users, [
            {
              ...updatedUser,
              proConnect: {
                externalId,
                siret: defaultExpectedIcIdTokenPayload.siret,
              },
            },
          ]);
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

        it("update user siret", () => {});
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
              `${immersionBaseUrl}/${frontRoutes[page]}?token=${correctToken}&firstName=John&lastName=Doe&email=john.doe@inclusion.com&idToken=inclusion-connect-id-token`,
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
            identityProvider: "proConnect",
          }),
        );
      });

      it("should raise a Forbidden error if the nonce does not match", async () => {
        const existingNonce = "existing-nonce";
        const initialOngoingOAuth: OngoingOAuth = {
          provider: "proConnect",
          state: "my-state",
          nonce: existingNonce,
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
      initialOngoingOAuth,
      userId,
    };
  };

  const addAlreadyExistingAuthenticatedUserInRepo = (
    options: {
      externalId?: string | null;
    } = {},
  ) => {
    const alreadyExistingUser: UserOnRepository = {
      id: "already-existing-id",
      email: "johnny-d@gmail.com",
      firstName: "Johnny",
      lastName: "Doe Existing",
      ...(options.externalId !== null
        ? {
            proConnect: {
              externalId:
                options.externalId !== undefined
                  ? options.externalId
                  : defaultExpectedIcIdTokenPayload.sub,
              siret: defaultExpectedIcIdTokenPayload.siret,
            },
          }
        : {}),
      createdAt: new Date().toISOString(),
    };
    uow.userRepository.users = [alreadyExistingUser];
    return { alreadyExistingUser };
  };
});
