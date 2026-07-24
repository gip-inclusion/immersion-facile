import type { Pool } from "pg";
import { ConnectedUserBuilder, expectToEqual } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../config/pg/pgPool";
import { PgUserRepository } from "../../core/authentication/connected-user/adapters/PgUserRepository";
import type { ArchivedConventionRequestEntity } from "../ports/ArchivedConventionRequestRepository";
import { PgArchivedConventionRequestRepository } from "./PgArchivedConventionRequestRepository";

describe("PgArchivedConventionRequestRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let repository: PgArchivedConventionRequestRepository;
  let userRepository: PgUserRepository;

  const user = new ConnectedUserBuilder().buildUser();
  const createdAt = "2024-06-01T12:00:00.000Z";
  const immersionAppellation = {
    appellationCode: "11573",
    appellationLabel: "Boulanger / Boulangère",
    romeCode: "D1102",
    romeLabel: "Boulangerie - viennoiserie",
  };

  beforeAll(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("archived_convention_requests").execute();
    await db.deleteFrom("users").where("id", "=", user.id).execute();

    userRepository = new PgUserRepository(db);
    repository = new PgArchivedConventionRequestRepository(db);

    await userRepository.save(user);
  });

  it("saves a request with conventionSearchMethod = withConventionId", async () => {
    const request: ArchivedConventionRequestEntity = {
      id: "11111111-1111-4111-8111-111111111111",
      userId: user.id,
      createdAt,
      conventionSearchMethod: "withConventionId",
      conventionId: "22222222-2222-4222-8222-222222222222",
      reason: "legalDispute",
    };

    await repository.save(request);

    expectToEqual(await repository.getAll(), [request]);
  });

  it("saves a request with conventionSearchMethod = withConventionDetails", async () => {
    const request: ArchivedConventionRequestEntity = {
      userId: user.id,
      createdAt,
      id: "33333333-3333-4333-8333-333333333333",
      conventionSearchMethod: "withConventionDetails",
      beneficiaryFirstName: "Jean",
      beneficiaryLastName: "Dupont",
      siret: "12345678901234",
      immersionDate: "2024-01-15",
      immersionAppellation,
      reason: "other",
      otherReason: "Motif personnalisé pour la demande",
    };

    await repository.save(request);

    expectToEqual(await repository.getAll(), [request]);
  });

  it("returns all requests sorted by createdAt descending", async () => {
    const olderRequest: ArchivedConventionRequestEntity = {
      id: "11111111-1111-4111-8111-111111111111",
      userId: user.id,
      createdAt: "2024-06-01T12:00:00.000Z",
      conventionSearchMethod: "withConventionId",
      conventionId: "22222222-2222-4222-8222-222222222222",
      reason: "legalDispute",
    };
    const newerRequest: ArchivedConventionRequestEntity = {
      id: "33333333-3333-4333-8333-333333333333",
      userId: user.id,
      createdAt: "2024-06-02T12:00:00.000Z",
      conventionSearchMethod: "withConventionDetails",
      beneficiaryFirstName: "Jean",
      beneficiaryLastName: "Dupont",
      siret: "12345678901234",
      immersionDate: "2024-01-15",
      immersionAppellation,
      reason: "other",
      otherReason: "Motif personnalisé pour la demande",
    };

    await repository.save(olderRequest);
    await repository.save(newerRequest);

    expectToEqual(await repository.getAll(), [newerRequest, olderRequest]);
  });
});
