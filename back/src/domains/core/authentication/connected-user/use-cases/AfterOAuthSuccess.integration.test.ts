import type { Pool } from "pg";
import { type AbsoluteUrl, expectObjectsToMatch } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../../config/pg/pgPool";
import { generateES256KeyPair } from "../../../../../utils/jwt";
import { fakeGenerateConnectedUserUrlFn } from "../../../../../utils/jwtTestHelper";
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
import { AfterOAuthSuccess } from "./AfterOAuthSuccess";

describe("AfterOAuthSuccess use case", () => {
  const immersionBaseUrl: AbsoluteUrl = "http://my-immersion-domain.com";
  const defaultExpectedIcIdTokenPayload: GetAccessTokenPayload = {
    nonce: "nounce",
    sub: "my-user-external-id",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@mail.com",
    siret: fakeProConnectSiret,
  };

  let pool: Pool;
  let db: KyselyDb;
  let uow: UnitOfWork;
  let oAuthGateway: InMemoryOAuthGateway;
  let afterOAuthSuccessRedirection: AfterOAuthSuccess;
  let timeGateway: CustomTimeGateway;

  beforeAll(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
    uow = createPgUow(db);
    const uuidGenerator = new UuidV4Generator();
    oAuthGateway = new InMemoryOAuthGateway(fakeProviderConfig);
    timeGateway = new CustomTimeGateway();
    afterOAuthSuccessRedirection = new AfterOAuthSuccess({
      uowPerformer: new PgUowPerformer(db, createPgUow),
      createNewEvent: makeCreateNewEvent({
        timeGateway,
        uuidGenerator,
      }),
      oAuthGateway,
      uuidGenerator,
      generateConnectedUserLoginUrl: fakeGenerateConnectedUserUrlFn,
      verifyEmailAuthCodeJwt: makeVerifyJwtES256<"emailAuthCode">(
        generateES256KeyPair().publicKey,
      ),
      immersionFacileBaseUrl: immersionBaseUrl,
      timeGateway,
    });
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

      await afterOAuthSuccessRedirection.execute({
        code: "my-code",
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
          lastLoginAt: expect.any(String),
        },
      );
    });
  });

  describe("when user connected before", () => {
    beforeEach(async () => {
      await db.deleteFrom("feature_flags").execute();
      await db.deleteFrom("users_ongoing_oauths").execute();
      await db.deleteFrom("users").execute();
    });

    it("updates the user as Authenticated user", async () => {
      const firstDay = new Date("2025-11-01T10:00:00Z");
      const secondDay = new Date("2025-11-03T10:00:00Z");
      timeGateway.setNextDates([firstDay, firstDay, firstDay, firstDay]);
      const { initialOngoingOAuth } =
        await makeSuccessfulAuthenticationConditions(
          `${immersionBaseUrl}/agencyDashboard`,
          defaultExpectedIcIdTokenPayload,
        );
      await afterOAuthSuccessRedirection.execute({
        code: "my-code",
        state: initialOngoingOAuth.state,
      });
      const firstLoginDate = (
        await uow.userRepository.findByExternalId(
          defaultExpectedIcIdTokenPayload.sub,
        )
      )?.lastLoginAt;

      timeGateway.setNextDates([secondDay, secondDay, secondDay, secondDay]);
      await makeSuccessfulAuthenticationConditions(
        `${immersionBaseUrl}/agencyDashboard`,
        defaultExpectedIcIdTokenPayload,
      );
      await afterOAuthSuccessRedirection.execute({
        code: "my-code",
        state: initialOngoingOAuth.state,
      });

      const secondLoginDate = (
        await uow.userRepository.findByExternalId(
          defaultExpectedIcIdTokenPayload.sub,
        )
      )?.lastLoginAt;
      expect(firstLoginDate).toBe(firstDay.toISOString());
      expect(secondLoginDate).toBe(secondDay.toISOString());
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

    const accessToken = "access-token";
    const idToken = "fake-id-token";
    oAuthGateway.setAccessTokenResponse({
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
