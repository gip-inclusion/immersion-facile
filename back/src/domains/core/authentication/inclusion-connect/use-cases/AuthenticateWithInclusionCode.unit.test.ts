import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  type AuthenticateWithOAuthCodeParams,
  type IdToken,
  type User,
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
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
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
            makeSuccessfulAuthenticationConditions({
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
              firstName: defaultExpectedIcIdTokenPayload.firstName,
              lastName: defaultExpectedIcIdTokenPayload.lastName,
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
