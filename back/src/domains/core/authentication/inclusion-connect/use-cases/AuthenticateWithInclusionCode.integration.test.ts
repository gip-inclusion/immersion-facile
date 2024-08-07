import { Pool } from "pg";
import { AbsoluteUrl, expectObjectsToMatch } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { makeCreateNewEvent } from "../../../events/ports/EventBus";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import { PgUowPerformer } from "../../../unit-of-work/adapters/PgUowPerformer";
import { createPgUow } from "../../../unit-of-work/adapters/createPgUow";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
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

describe("AuthenticateWithInclusionCode use case", () => {
  const defaultExpectedIcIdTokenPayload: InclusionConnectIdTokenPayload = {
    nonce: "nounce",
    sub: "my-user-external-id",
    given_name: "John",
    family_name: "Doe",
    email: "john.doe@inclusion.com",
  };

  let pool: Pool;
  let uow: UnitOfWork;
  let transaction: KyselyDb;
  let inclusionConnectGateway: InMemoryInclusionConnectGateway;
  let authenticateWithInclusionCode: AuthenticateWithInclusionCode;

  beforeAll(async () => {
    pool = getTestPgPool();
    transaction = makeKyselyDb(pool);
    uow = createPgUow(transaction);
    const uuidGenerator = new UuidV4Generator();
    const immersionRedirectUri: AbsoluteUrl =
      "http://immersion-uri.com/my-redirection";

    inclusionConnectGateway = new InMemoryInclusionConnectGateway();
    authenticateWithInclusionCode = new AuthenticateWithInclusionCode(
      new PgUowPerformer(pool, createPgUow),
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
      new CustomTimeGateway(),
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await transaction.deleteFrom("users_ongoing_oauths").execute();
    await transaction.deleteFrom("users").execute();
  });

  describe("when user had never connected before", () => {
    it("saves the user as Authenticated user", async () => {
      const { accessToken, initialOngoingOAuth } =
        await makeSuccessfulAuthenticationConditions();

      await authenticateWithInclusionCode.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
        page: "agencyDashboard",
      });

      const expectedOngoingOauth = await uow.ongoingOAuthRepository.findByState(
        initialOngoingOAuth.state,
        initialOngoingOAuth.provider,
      );

      expectObjectsToMatch(expectedOngoingOauth, {
        ...initialOngoingOAuth,
        accessToken,
        externalId: defaultExpectedIcIdTokenPayload.sub,
      });

      expectObjectsToMatch(
        await uow.userRepository.findByExternalId(
          defaultExpectedIcIdTokenPayload.sub,
        ),
        {
          id: expectedOngoingOauth?.userId,
          firstName: defaultExpectedIcIdTokenPayload.given_name,
          lastName: defaultExpectedIcIdTokenPayload.family_name,
          email: defaultExpectedIcIdTokenPayload.email,
          externalId: defaultExpectedIcIdTokenPayload.sub,
        },
      );
    });
  });

  const makeSuccessfulAuthenticationConditions = async (
    expectedIcIdTokenPayload = defaultExpectedIcIdTokenPayload,
  ) => {
    const initialOngoingOAuth: OngoingOAuth = {
      provider: "inclusionConnect",
      state: "da1b4d59-ff5b-4b28-a34a-2a31da76a7b7",
      nonce: "nounce", // matches the one in the payload of the token
    };
    await uow.ongoingOAuthRepository.save(initialOngoingOAuth);

    const accessToken = "inclusion-access-token";
    inclusionConnectGateway.setAccessTokenResponse({
      icIdTokenPayload: expectedIcIdTokenPayload,
      accessToken,
      expire: 60,
    });

    return {
      accessToken,
      initialOngoingOAuth,
    };
  };
});
