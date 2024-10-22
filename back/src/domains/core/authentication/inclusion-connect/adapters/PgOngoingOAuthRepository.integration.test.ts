import { Pool } from "pg";
import {
  IdentityProvider,
  User,
  expectToEqual,
  oAuthGatewayProviders,
} from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { PgOngoingOAuthRepository } from "./PgOngoingOAuthRepository";
import { PgUserRepository } from "./PgUserRepository";

describe("PgOngoingOAuthRepository", () => {
  let pool: Pool;
  let pgOngoingOAuthRepository: PgOngoingOAuthRepository;
  let pgUserRepository: PgUserRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgOngoingOAuthRepository = new PgOngoingOAuthRepository(db);
    pgUserRepository = new PgUserRepository(db);
  });

  beforeEach(async () => {
    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe.each(oAuthGatewayProviders)(
    "with provider '%s'",
    (gatewayProvider) => {
      it("saves an ongoing OAuth, then gets it from its states, then updates it, than gets ongoingOauth from userId", async () => {
        const state = "11111111-1111-1111-1111-111111111111";

        const provider: IdentityProvider =
          gatewayProvider === "InclusionConnect"
            ? "inclusionConnect"
            : "proConnect";

        const ongoingOAuth: OngoingOAuth = {
          state,
          nonce: "123",
          provider,
        };
        const user: User = {
          id: "22222222-2222-2222-2222-222222222222",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@mail.com",
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };
        await pgUserRepository.save(user, gatewayProvider);
        await pgOngoingOAuthRepository.save(ongoingOAuth);

        const fetchedFromState =
          await pgOngoingOAuthRepository.findByStateAndProvider(
            state,
            provider,
          );
        expectToEqual(fetchedFromState, ongoingOAuth);

        const results = await db
          .selectFrom("users_ongoing_oauths")
          .selectAll()
          .execute();
        expect(results).toHaveLength(1);

        await pgUserRepository.save(user, gatewayProvider);
        const updatedOngoingOAuth: OngoingOAuth = {
          ...ongoingOAuth,
          userId: user.id,
          externalId: user.externalId ?? undefined,
          accessToken: "some-token",
        };
        await pgOngoingOAuthRepository.save(updatedOngoingOAuth);

        const fetchedFromUserId = await pgOngoingOAuthRepository.findByUserId(
          user.id,
        );
        expectToEqual(fetchedFromUserId, updatedOngoingOAuth);
      });
    },
  );
});
