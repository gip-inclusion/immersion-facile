import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  AuthenticatedUser,
  allowedStartInclusionConnectLoginPages,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryInclusionConnectGateway } from "../../../adapters/secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { OngoingOAuth } from "../../generic/OAuth/entities/OngoingOAuth";
import { InclusionConnectIdTokenPayload } from "../entities/InclusionConnectIdTokenPayload";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";
const correctToken = "my-correct-token";
const clientId = "my-client-id";
const clientSecret = "my-client-secret";
const scope = "openid profile email";

const inclusionConnectBaseUri: AbsoluteUrl =
  "http://fake-inclusion-connect-uri.com";

describe("AuthenticateWithInclusionCode use case", () => {
  const defaultExpectedIcIdTokenPayload: InclusionConnectIdTokenPayload = {
    nonce: "nounce",
    sub: "my-user-id",
    given_name: "John",
    family_name: "Doe",
    email: "john.doe@inclusion.com",
  };

  let uow: InMemoryUnitOfWork;
  let inclusionConnectGateway: InMemoryInclusionConnectGateway;
  let uuidGenerator: TestUuidGenerator;
  let useCase: AuthenticateWithInclusionCode;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    inclusionConnectGateway = new InMemoryInclusionConnectGateway();
    const immersionBaseUri: AbsoluteUrl = "http://immersion-uri.com";
    const immersionRedirectUri: AbsoluteUrl = `${immersionBaseUri}/my-redirection`;
    useCase = new AuthenticateWithInclusionCode(
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
    );
  });

  describe("right paths", () => {
    describe("when user had never connected before", () => {
      it("saves the user as Authenticated user", async () => {
        const { initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions();

        await useCase.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectToEqual(uow.authenticatedUserRepository.users, [
          {
            id: userId,
            firstName: defaultExpectedIcIdTokenPayload.given_name,
            lastName: defaultExpectedIcIdTokenPayload.family_name,
            email: defaultExpectedIcIdTokenPayload.email,
          },
        ]);
      });

      it("updates ongoingOAuth with userId, accessToken and externalId", async () => {
        const { accessToken, initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions();

        await useCase.execute({
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

        await useCase.execute({
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

        expectToEqual(uow.authenticatedUserRepository.users, [
          {
            id: alreadyExistingUser.id,
            email: alreadyExistingUser.email,
            firstName: alreadyExistingUser.firstName,
            lastName: alreadyExistingUser.lastName,
          },
        ]);

        await useCase.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectToEqual(uow.authenticatedUserRepository.users, [
          {
            id: alreadyExistingUser.id,
            email: alreadyExistingUser.email,
            firstName: defaultExpectedIcIdTokenPayload.given_name,
            lastName: defaultExpectedIcIdTokenPayload.family_name,
          },
        ]);
      });
    });

    describe("handle dynamic login pages", () => {
      it.each(allowedStartInclusionConnectLoginPages)(
        "generates an app token and returns a redirection url which includes token and user data for %s",
        async (page) => {
          const { initialOngoingOAuth } =
            makeSuccessfulAuthenticationConditions();

          const redirectedUrl = await useCase.execute({
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

    describe("handle PE structure", () => {
      const agency = new AgencyDtoBuilder().withCodeSafir("546546645").build();

      const peSpecificIcIdTokenPayload: InclusionConnectIdTokenPayload = {
        ...defaultExpectedIcIdTokenPayload,
        structure_pe: agency.codeSafir ?? undefined,
      };

      it("add agency right to IC user when Pe structure code is provided by IC and user has no rights on agency", async () => {
        const { initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions(peSpecificIcIdTokenPayload);

        uow.agencyRepository.setAgencies([agency]);

        await useCase.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectToEqual(uow.authenticatedUserRepository.users, [
          {
            email: peSpecificIcIdTokenPayload.email,
            firstName: peSpecificIcIdTokenPayload.given_name,
            lastName: peSpecificIcIdTokenPayload.family_name,
            id: userId,
          },
        ]);

        expectToEqual(
          uow.inclusionConnectedUserRepository.agencyRightsByUserId,
          {
            [userId]: [{ agency, role: "validator" }],
          },
        );
      });

      it("don't add agency right to IC user when Pe structure code is provided by IC and user already has rights on agency", async () => {
        const { initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions(peSpecificIcIdTokenPayload);

        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            email: peSpecificIcIdTokenPayload.email,
            firstName: peSpecificIcIdTokenPayload.given_name,
            lastName: peSpecificIcIdTokenPayload.family_name,
            id: userId,
            agencyRights: [{ agency, role: "agencyOwner" }],
            establishmentDashboards: {},
          },
        ]);

        uow.agencyRepository.setAgencies([agency]);

        await useCase.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectToEqual(uow.authenticatedUserRepository.users, [
          {
            email: peSpecificIcIdTokenPayload.email,
            firstName: peSpecificIcIdTokenPayload.given_name,
            lastName: peSpecificIcIdTokenPayload.family_name,
            id: userId,
          },
        ]);

        expectToEqual(
          uow.inclusionConnectedUserRepository.agencyRightsByUserId,
          {
            [userId]: [{ agency, role: "agencyOwner" }],
          },
        );
      });

      it("replace agency right to IC user when Pe structure code is provided by IC and user already has rights on agency and current right is toReview", async () => {
        const { initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions(peSpecificIcIdTokenPayload);

        uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
          {
            email: peSpecificIcIdTokenPayload.email,
            firstName: peSpecificIcIdTokenPayload.given_name,
            lastName: peSpecificIcIdTokenPayload.family_name,
            id: userId,
            agencyRights: [{ agency, role: "toReview" }],
            establishmentDashboards: {},
          },
        ]);

        uow.agencyRepository.setAgencies([agency]);

        await useCase.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectToEqual(uow.authenticatedUserRepository.users, [
          {
            email: peSpecificIcIdTokenPayload.email,
            firstName: peSpecificIcIdTokenPayload.given_name,
            lastName: peSpecificIcIdTokenPayload.family_name,
            id: userId,
          },
        ]);

        expectToEqual(
          uow.inclusionConnectedUserRepository.agencyRightsByUserId,
          {
            [userId]: [{ agency, role: "validator" }],
          },
        );
      });

      it("don't add agency right to IC user when Pe structure code is provided by IC and there is not agency with same Pe structure code", async () => {
        const { initialOngoingOAuth, userId } =
          makeSuccessfulAuthenticationConditions(peSpecificIcIdTokenPayload);

        await useCase.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        expectToEqual(uow.authenticatedUserRepository.users, [
          {
            email: peSpecificIcIdTokenPayload.email,
            firstName: peSpecificIcIdTokenPayload.given_name,
            lastName: peSpecificIcIdTokenPayload.family_name,
            id: userId,
          },
        ]);

        expectToEqual(
          uow.inclusionConnectedUserRepository.agencyRightsByUserId,
          {},
        );
      });
    });
  });

  describe("wrong paths", () => {
    it("rejects the connection if no state match the provided one in DB", async () => {
      await expectPromiseToFailWithError(
        useCase.execute({
          code: "my-inclusion-code",
          state: "my-state",
          page: "agencyDashboard",
        }),
        new ForbiddenError("No ongoing OAuth with provided state : my-state"),
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
        useCase.execute({
          code: "my-inclusion-code",
          state: "my-state",
          page: "agencyDashboard",
        }),
        new ForbiddenError("Nonce mismatch"),
      );
    });
  });

  const makeSuccessfulAuthenticationConditions = (
    expectedIcIdTokenPayload = defaultExpectedIcIdTokenPayload,
  ) => {
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

  const addAlreadyExistingAuthenticatedUserInRepo = () => {
    const alreadyExistingUser: AuthenticatedUser = {
      id: "already-existing-id",
      email: defaultExpectedIcIdTokenPayload.email,
      firstName: "Johnny",
      lastName: "Doe Existing",
    };
    uow.authenticatedUserRepository.users = [alreadyExistingUser];
    return { alreadyExistingUser };
  };
});
