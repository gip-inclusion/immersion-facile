import type { Pool } from "pg";
import { type User, expectToEqual } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import { PgOngoingOAuthRepository } from "./PgOngoingOAuthRepository";
import { PgUserRepository } from "./PgUserRepository";
import { fakeProConnectSiret } from "./oauth-gateway/InMemoryOAuthGateway";

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

  const state = "11111111-1111-1111-1111-111111111111";
  const ongoingOAuth: OngoingOAuth = {
    fromUri: "/uriWithSome?queryParam1=yeah&param2=haaaannnnnnnnn",
    state,
    nonce: "123",
    provider: "proConnect",
    usedAt: null,
  };
  const user: User = {
    id: "22222222-2222-2222-2222-222222222222",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@mail.com",
    proConnect: {
      externalId: "john-external-id",
      siret: fakeProConnectSiret,
    },
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
    await pgUserRepository.save(user);
    await pgOngoingOAuthRepository.save(ongoingOAuth);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("with provider 'proConnect'", () => {
    it("saves an ongoing OAuth, then gets it from its states, then updates it, than gets ongoingOauth from userId", async () => {
      const fetchedFromState =
        await pgOngoingOAuthRepository.findByState(state);
      expectToEqual(fetchedFromState, ongoingOAuth);

      const results = await db
        .selectFrom("users_ongoing_oauths")
        .selectAll()
        .execute();
      expect(results).toHaveLength(1);

      await pgUserRepository.save(user);
      const updatedOngoingOAuth: OngoingOAuth = {
        ...ongoingOAuth,
        userId: user.id,
        externalId: user.proConnect?.externalId,
        accessToken: "some-token",
      };
      await pgOngoingOAuthRepository.save(updatedOngoingOAuth);

      const fetchedFromUserId = await pgOngoingOAuthRepository.findByUserId(
        user.id,
      );
      expectToEqual(fetchedFromUserId, updatedOngoingOAuth);
    });

    it("also saves the date of use and the email when it is of kind email", async () => {
      const state = "22222222-2222-2222-2222-222222222222";
      const ongoingOAuth: OngoingOAuth = {
        fromUri: "/uri",
        state,
        nonce: "444",
        provider: "email",
        email: "bob@mail.com",
        usedAt: null,
      };
      await pgOngoingOAuthRepository.save(ongoingOAuth);

      const fetchedFromState =
        await pgOngoingOAuthRepository.findByState(state);

      expectToEqual(fetchedFromState, ongoingOAuth);

      const updatedOngoingOAuth: OngoingOAuth = {
        ...ongoingOAuth,
        userId: user.id,
        usedAt: new Date(),
      };
      await pgOngoingOAuthRepository.save(updatedOngoingOAuth);
      const fetchedFromUserId = await pgOngoingOAuthRepository.findByUserId(
        user.id,
      );
      expectToEqual(fetchedFromUserId, {
        ...updatedOngoingOAuth,
        email: ongoingOAuth.email,
      });
    });
  });
});
