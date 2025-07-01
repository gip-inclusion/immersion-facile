import type { Pool } from "pg";
import { type AbsoluteUrl, expectObjectsToMatch } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { generateES256KeyPair } from "../../../../../utils/jwt";
import { makeCreateNewEvent } from "../../../events/ports/EventBus";
import { makeVerifyJwtES256 } from "../../../jwt";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import { createPgUow } from "../../../unit-of-work/adapters/createPgUow";
import { PgUowPerformer } from "../../../unit-of-work/adapters/PgUowPerformer";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  fakeProConnectSiret,
  fakeProviderConfig,
  InMemoryOAuthGateway,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import type { GetAccessTokenPayload } from "../port/OAuthGateway";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

describe("AuthenticateWithInclusionCode use case", () => {
  const correctToken = "my-correct-token";
  const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";
  const defaultExpectedIcIdTokenPayload: GetAccessTokenPayload = {
    nonce: "nounce",
    sub: "my-user-external-id",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@inclusion.com",
    siret: fakeProConnectSiret,
  };

  let pool: Pool;
  let db: KyselyDb;
  let uow: UnitOfWork;
  let inclusionConnectGateway: InMemoryOAuthGateway;
  let authenticateWithInclusionCode: AuthenticateWithInclusionCode;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    uow = createPgUow(db);
    const uuidGenerator = new UuidV4Generator();
    inclusionConnectGateway = new InMemoryOAuthGateway(fakeProviderConfig);
    authenticateWithInclusionCode = new AuthenticateWithInclusionCode(
      new PgUowPerformer(db, createPgUow),
      makeCreateNewEvent({
        timeGateway: new CustomTimeGateway(),
        uuidGenerator,
      }),
      inclusionConnectGateway,
      uuidGenerator,
      () => correctToken,
      makeVerifyJwtES256<"emailAuthCode">(generateES256KeyPair().publicKey),
      immersionBaseUrl,
      new CustomTimeGateway(),
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("when user had never connected before", () => {
    beforeEach(async () => {
      await db.deleteFrom("feature_flags").execute();
      await db.deleteFrom("users_ongoing_oauths").execute();
      await db.deleteFrom("users").execute();
    });

    it("saves the user as Authenticated user", async () => {
      const { accessToken, initialOngoingOAuth } =
        await makeSuccessfulAuthenticationConditions(
          `${immersionBaseUrl}/agencyDashboard`,
        );

      await authenticateWithInclusionCode.execute({
        code: "my-inclusion-code",
        state: initialOngoingOAuth.state,
      });

      const expectedOngoingOauth = await uow.ongoingOAuthRepository.findByState(
        initialOngoingOAuth.state,
      );

      expectObjectsToMatch(expectedOngoingOauth, {
        ...initialOngoingOAuth,
        usedAt: expect.any(Date),
        userId: expect.any(String),
        accessToken,
        externalId: defaultExpectedIcIdTokenPayload.sub,
      });

      expectObjectsToMatch(
        await uow.userRepository.findByExternalId(
          defaultExpectedIcIdTokenPayload.sub,
        ),
        {
          id: expectedOngoingOauth?.userId,
          firstName: defaultExpectedIcIdTokenPayload.firstName,
          lastName: defaultExpectedIcIdTokenPayload.lastName,
          email: defaultExpectedIcIdTokenPayload.email,
          proConnect: {
            externalId: defaultExpectedIcIdTokenPayload.sub,
            siret: defaultExpectedIcIdTokenPayload.siret,
          },
        },
      );
    });
  });

  const makeSuccessfulAuthenticationConditions = async (
    fromUri: string,
    expectedIcIdTokenPayload = defaultExpectedIcIdTokenPayload,
  ) => {
    const initialOngoingOAuth: OngoingOAuth = {
      provider: "proConnect",
      state: "da1b4d59-ff5b-4b28-a34a-2a31da76a7b7",
      nonce: "nounce", // matches the one in the payload of the token
      usedAt: null,
      fromUri,
    };
    await uow.ongoingOAuthRepository.save(initialOngoingOAuth);

    const accessToken = "inclusion-access-token";
    const idToken = "fake-id-token";
    inclusionConnectGateway.setAccessTokenResponse({
      payload: expectedIcIdTokenPayload,
      accessToken,
      idToken,
      expire: 60,
    });

    return {
      accessToken,
      initialOngoingOAuth,
    };
  };
});
