import type { Pool } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  errors,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../../config/pg/pgPool";
import { toAgencyWithRights } from "../../../../../utils/agency";
import { makeUniqueUserForTest } from "../../../../../utils/user";
import { PgAgencyRepository } from "../../../../agency/adapters/PgAgencyRepository";
import { PgConventionExternalIdRepository } from "../../../../convention/adapters/PgConventionExternalIdRepository";
import { PgConventionRepository } from "../../../../convention/adapters/PgConventionRepository";
import { PgUserRepository } from "../../connected-user/adapters/PgUserRepository";
import type {
  ConventionFtUserAdvisorEntity,
  FtUserAndAdvisor,
} from "../dto/FtConnect.dto";
import type { FtConnectImmersionAdvisorDto } from "../dto/FtConnectAdvisor.dto";
import type { FtConnectUserDto } from "../dto/FtConnectUserDto";
import { PgConventionFranceTravailAdvisorRepository } from "./PgConventionFranceTravailAdvisorRepository";

const conventionId = "88401348-bad9-4933-87c6-405b8a8fe4cc";
const userFtExternalId = "92f44bbf-103d-4312-bd74-217c7d79f618";

const convention = new ConventionDtoBuilder().withId(conventionId).build();

const user: FtConnectUserDto = {
  email: "",
  firstName: "",
  isJobseeker: true,
  lastName: "",
  peExternalId: userFtExternalId,
  birthdate: "",
};
const placementAdvisor: FtConnectImmersionAdvisorDto = {
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@pole-emploi.fr",
  type: "PLACEMENT",
};
const capemploiAdvisor: FtConnectImmersionAdvisorDto = {
  firstName: "Jeanne",
  lastName: "Delamare",
  email: "jeanne.delamare@pole-emploi.fr",
  type: "CAPEMPLOI",
};
const franceTravailFirstUserAdvisor: FtUserAndAdvisor = {
  advisor: placementAdvisor,
  user,
};

const franceTravailFirstUserWithoutAdvisor: FtUserAndAdvisor = {
  advisor: undefined,
  user,
};

const franceTravailUpdatedUserAdvisor: FtUserAndAdvisor = {
  advisor: capemploiAdvisor,
  user,
};

describe("PgConventionFranceTravailAdvisorRepository", () => {
  let pool: Pool;
  let conventionFranceTravailAdvisorRepository: PgConventionFranceTravailAdvisorRepository;
  let conventionRepository: PgConventionRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
    await db.deleteFrom("conventions__ft_connect_users").execute();
    await db.deleteFrom("ft_connect_users").execute();
    // REVIEW I had to add this not to have an error
    // TODO Remove when https://git.beta.pole-emploi.fr/jburkard/immersion-facile/-/merge_requests/967 is merged ?
    await db.deleteFrom("immersion_assessments").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agencies").execute();

    const agencyRepository = new PgAgencyRepository(db);

    const validator = makeUniqueUserForTest(uuid());
    await new PgUserRepository(db).save(validator);
    await agencyRepository.insert(
      toAgencyWithRights(AgencyDtoBuilder.create().build(), {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );

    conventionRepository = new PgConventionRepository(db);
    const conventionExternalIdRepository = new PgConventionExternalIdRepository(
      db,
    );
    await conventionRepository.save(convention);
    await conventionExternalIdRepository.save(convention.id);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("conventions__ft_connect_users").execute();
    await db.deleteFrom("ft_connect_users").execute();
    conventionFranceTravailAdvisorRepository =
      new PgConventionFranceTravailAdvisorRepository(db);
  });

  describe("saveFtUserAndAdvisor", () => {
    it("should open a slot if no open slot is present", async () => {
      await conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor(
        franceTravailFirstUserAdvisor,
      );

      expectToEqual(
        await db.selectFrom("ft_connect_users").selectAll().execute(),
        [
          {
            ft_connect_id: franceTravailFirstUserAdvisor.user.peExternalId,
            advisor_firstname: placementAdvisor.firstName,
            advisor_lastname: placementAdvisor.lastName,
            advisor_email: placementAdvisor.email,
            advisor_kind: placementAdvisor.type,
            created_at: expect.any(Date),
            updated_at: expect.any(Date),
          },
        ],
      );

      expectToEqual(
        await db
          .selectFrom("conventions__ft_connect_users")
          .selectAll()
          .execute(),
        [],
      );
    });

    it("should open a slot with no advisor", async () => {
      await conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor(
        franceTravailFirstUserWithoutAdvisor,
      );

      expectToEqual(
        await db.selectFrom("ft_connect_users").selectAll().execute(),
        [
          {
            ft_connect_id: franceTravailFirstUserAdvisor.user.peExternalId,
            advisor_firstname: null,
            advisor_lastname: null,
            advisor_email: null,
            advisor_kind: null,
            created_at: expect.any(Date),
            updated_at: expect.any(Date),
          },
        ],
      );

      expectToEqual(
        await db
          .selectFrom("conventions__ft_connect_users")
          .selectAll()
          .execute(),
        [],
      );
    });

    it("should update the open slot if it already exist", async () => {
      await conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor(
        franceTravailFirstUserAdvisor,
      );

      await conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor(
        franceTravailUpdatedUserAdvisor,
      );

      expectToEqual(
        await db.selectFrom("ft_connect_users").selectAll().execute(),
        [
          {
            ft_connect_id: franceTravailUpdatedUserAdvisor.user.peExternalId,
            advisor_firstname: capemploiAdvisor.firstName,
            advisor_lastname: capemploiAdvisor.lastName,
            advisor_email: capemploiAdvisor.email,
            advisor_kind: capemploiAdvisor.type,
            created_at: expect.any(Date),
            updated_at: expect.any(Date),
          },
        ],
      );

      expectToEqual(
        await db
          .selectFrom("conventions__ft_connect_users")
          .selectAll()
          .execute(),
        [],
      );
    });
  });

  describe("associateConventionAndUserAdvisor", () => {
    it("should throw a not found error if no suitable opened conventionFranceTravailUserAdvisor is present", async () => {
      await expect(
        conventionFranceTravailAdvisorRepository.associateConventionAndUserAdvisor(
          conventionId,
          userFtExternalId,
        ),
      ).rejects.toThrow(
        errors.ftConnect.associationFailed({
          rowCount: 0,
          conventionId,
          ftExternalId: userFtExternalId,
        }),
      );
    });

    it("should update the entity in db if a suitable conventionFranceTravailUserAdvisor was found", async () => {
      await conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor(
        franceTravailFirstUserAdvisor,
      );
      await conventionFranceTravailAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userFtExternalId,
      );

      expectToEqual(
        await db.selectFrom("ft_connect_users").selectAll().execute(),
        [
          {
            ft_connect_id: franceTravailFirstUserAdvisor.user.peExternalId,
            advisor_firstname: placementAdvisor.firstName,
            advisor_lastname: placementAdvisor.lastName,
            advisor_email: placementAdvisor.email,
            advisor_kind: placementAdvisor.type,
            created_at: expect.any(Date),
            updated_at: expect.any(Date),
          },
        ],
      );

      expectToEqual(
        await db
          .selectFrom("conventions__ft_connect_users")
          .selectAll()
          .execute(),
        [
          {
            convention_id: conventionId,
            ft_connect_id: franceTravailFirstUserAdvisor.user.peExternalId,
            created_at: expect.any(Date),
          },
        ],
      );
    });
  });

  describe("getByConventionId", () => {
    it("should return undefined if no convention Advisor", async () => {
      const conventionAdvisor: ConventionFtUserAdvisorEntity | undefined =
        await conventionFranceTravailAdvisorRepository.getByConventionId(
          conventionId,
        );

      expect(conventionAdvisor).toBeUndefined();
    });

    it("should get the convention Advisor by the convention id", async () => {
      await conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor(
        franceTravailFirstUserAdvisor,
      );
      await conventionFranceTravailAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userFtExternalId,
      );

      const conventionAdvisor: ConventionFtUserAdvisorEntity | undefined =
        await conventionFranceTravailAdvisorRepository.getByConventionId(
          conventionId,
        );

      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      expectObjectsToMatch(conventionAdvisor!, {
        advisor: franceTravailFirstUserAdvisor.advisor,
        peExternalId: franceTravailFirstUserAdvisor.user.peExternalId,
        conventionId,
      });
    });

    it("convention advisor without advisor", async () => {
      await conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor(
        franceTravailFirstUserWithoutAdvisor,
      );
      await conventionFranceTravailAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userFtExternalId,
      );

      const conventionAdvisor: ConventionFtUserAdvisorEntity | undefined =
        await conventionFranceTravailAdvisorRepository.getByConventionId(
          conventionId,
        );

      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      expectObjectsToMatch(conventionAdvisor!, {
        advisor: undefined,
        peExternalId: franceTravailFirstUserAdvisor.user.peExternalId,
        conventionId,
      });
    });
  });

  describe("deleteByConventionId", () => {
    it("should deleted by conventionId", async () => {
      expect(
        (await conventionRepository.getById(conventionId))?.signatories
          .beneficiary.federatedIdentity,
      ).toBeUndefined();

      await conventionFranceTravailAdvisorRepository.saveFtUserAndAdvisor(
        franceTravailFirstUserAdvisor,
      );
      await conventionFranceTravailAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userFtExternalId,
      );

      expectToEqual(
        (await conventionRepository.getById(conventionId))?.signatories
          .beneficiary.federatedIdentity,
        {
          provider: "peConnect",
          token: userFtExternalId,
          payload: {
            advisor: placementAdvisor,
          },
        },
      );
      expect(
        (
          await db
            .selectFrom("conventions__ft_connect_users")
            .selectAll()
            .execute()
        ).length,
      ).toBe(1);

      await conventionFranceTravailAdvisorRepository.deleteByConventionId(
        conventionId,
      );

      expect(
        (await conventionRepository.getById(conventionId))?.signatories
          .beneficiary.federatedIdentity,
      ).toBeUndefined();
      expectToEqual(
        await db
          .selectFrom("conventions__ft_connect_users")
          .selectAll()
          .execute(),
        [],
      );
      // FT user should still exist
      expect(
        (await db.selectFrom("ft_connect_users").selectAll().execute()).length,
      ).toBe(1);
    });
  });
});
