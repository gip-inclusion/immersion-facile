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
import {
  InMemoryInclusionConnectGateway,
  fakeInclusionConnectConfig,
} from "../adapters/Inclusion-connect-gateway/InMemoryInclusionConnectGateway";
import { InclusionConnectIdTokenPayload } from "../entities/InclusionConnectIdTokenPayload";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

const correctToken = "my-correct-token";
const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";

describe("AuthenticateWithInclusionCode use case", () => {
  const defaultExpectedIcIdTokenPayload: InclusionConnectIdTokenPayload = {
    nonce: "nounce",
    sub: "my-user-external-id",
    given_name: "John",
    family_name: "Doe",
    email: "john.doe@inclusion.com",
  };

  let pool: Pool;
  let db: KyselyDb;
  let uow: UnitOfWork;
  let inclusionConnectGateway: InMemoryInclusionConnectGateway;
  let authenticateWithInclusionCode: AuthenticateWithInclusionCode;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    uow = createPgUow(db);
    const uuidGenerator = new UuidV4Generator();
    inclusionConnectGateway = new InMemoryInclusionConnectGateway(
      fakeInclusionConnectConfig,
    );
    authenticateWithInclusionCode = new AuthenticateWithInclusionCode(
      new PgUowPerformer(db, createPgUow),
      makeCreateNewEvent({
        timeGateway: new CustomTimeGateway(),
        uuidGenerator,
      }),
      inclusionConnectGateway,
      uuidGenerator,
      () => correctToken,
      immersionBaseUrl,
      new CustomTimeGateway(),
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
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
