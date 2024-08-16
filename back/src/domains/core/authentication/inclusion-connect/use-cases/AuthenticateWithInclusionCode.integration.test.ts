import { Pool } from "pg";
import { AbsoluteUrl, expectObjectsToMatch } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { makeCreateNewEvent } from "../../../events/ports/EventBus";
import { defaultFlags } from "../../../feature-flags/adapters/InMemoryFeatureFlagRepository";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import { PgUowPerformer } from "../../../unit-of-work/adapters/PgUowPerformer";
import { createPgUow } from "../../../unit-of-work/adapters/createPgUow";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  InMemoryOAuthGateway,
  fakeInclusionConnectConfig,
} from "../adapters/oauth-gateway/InMemoryOAuthGateway";
import { OAuthIdTokenPayload } from "../entities/OAuthIdTokenPayload";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { OAuthGatewayMode, oAuthGatewayModes } from "../port/OAuthGateway";
import { AuthenticateWithInclusionCode } from "./AuthenticateWithInclusionCode";

const correctToken = "my-correct-token";
const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";

describe("AuthenticateWithInclusionCode use case", () => {
  const defaultExpectedIcIdTokenPayload: OAuthIdTokenPayload = {
    nonce: "nounce",
    sub: "my-user-external-id",
    given_name: "John",
    family_name: "Doe",
    email: "john.doe@inclusion.com",
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
    inclusionConnectGateway = new InMemoryOAuthGateway(
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

  describe.each(oAuthGatewayModes)(
    "when user had never connected before with mode '%s'",
    (mode) => {
      beforeEach(async () => {
        await db.deleteFrom("feature_flags").execute();
        await db.deleteFrom("users_ongoing_oauths").execute();
        await db.deleteFrom("users").execute();

        uow.featureFlagRepository.insertAll({
          ...defaultFlags,
          enableProConnect: {
            kind: "boolean",
            isActive: mode === "ProConnect",
          },
        });
      });

      it("saves the user as Authenticated user", async () => {
        const { accessToken, initialOngoingOAuth } =
          await makeSuccessfulAuthenticationConditions(mode);

        await authenticateWithInclusionCode.execute({
          code: "my-inclusion-code",
          state: initialOngoingOAuth.state,
          page: "agencyDashboard",
        });

        const expectedOngoingOauth =
          await uow.ongoingOAuthRepository.findByStateAndProvider(
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
            mode,
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
    },
  );

  const makeSuccessfulAuthenticationConditions = async (
    mode: OAuthGatewayMode,
    expectedIcIdTokenPayload = defaultExpectedIcIdTokenPayload,
  ) => {
    const initialOngoingOAuth: OngoingOAuth = {
      provider: mode === "InclusionConnect" ? "inclusionConnect" : "proConnect",
      state: "da1b4d59-ff5b-4b28-a34a-2a31da76a7b7",
      nonce: "nounce", // matches the one in the payload of the token
    };
    await uow.ongoingOAuthRepository.save(initialOngoingOAuth);

    const accessToken = "inclusion-access-token";
    inclusionConnectGateway.setAccessTokenResponse({
      oAuthIdTokenPayload: expectedIcIdTokenPayload,
      accessToken,
      expire: 60,
    });

    return {
      accessToken,
      initialOngoingOAuth,
    };
  };
});
