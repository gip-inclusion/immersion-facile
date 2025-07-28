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
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
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
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    await db.deleteFrom("partners_pe_connect").execute();
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
    await db.deleteFrom("partners_pe_connect").execute();
    conventionFranceTravailAdvisorRepository =
      new PgConventionFranceTravailAdvisorRepository(db);
  });

  describe("openSlotForNextConvention", () => {
    it("should open a slot if no open slot is present", async () => {
      await conventionFranceTravailAdvisorRepository.openSlotForNextConvention(
        franceTravailFirstUserAdvisor,
      );

      expectToEqual(
        await db.selectFrom("partners_pe_connect").selectAll().execute(),
        [
          {
            user_pe_external_id:
              franceTravailFirstUserAdvisor.user.peExternalId,
            convention_id: "00000000-0000-0000-0000-000000000000",
            firstname: placementAdvisor.firstName,
            lastname: placementAdvisor.lastName,
            email: placementAdvisor.email,
            type: placementAdvisor.type,
          },
        ],
      );
    });

    it("should open a slot with no advisor", async () => {
      await conventionFranceTravailAdvisorRepository.openSlotForNextConvention(
        franceTravailFirstUserWithoutAdvisor,
      );

      expectToEqual(
        await db.selectFrom("partners_pe_connect").selectAll().execute(),
        [
          {
            user_pe_external_id:
              franceTravailFirstUserAdvisor.user.peExternalId,
            convention_id: "00000000-0000-0000-0000-000000000000",
            firstname: null,
            lastname: null,
            email: null,
            type: null,
          },
        ],
      );
    });

    it("should update the open slot if it already exist", async () => {
      await conventionFranceTravailAdvisorRepository.openSlotForNextConvention(
        franceTravailFirstUserAdvisor,
      );

      await conventionFranceTravailAdvisorRepository.openSlotForNextConvention(
        franceTravailUpdatedUserAdvisor,
      );

      expectToEqual(
        await db.selectFrom("partners_pe_connect").selectAll().execute(),
        [
          {
            user_pe_external_id:
              franceTravailUpdatedUserAdvisor.user.peExternalId,
            convention_id: "00000000-0000-0000-0000-000000000000",
            firstname: capemploiAdvisor.firstName,
            lastname: capemploiAdvisor.lastName,
            email: capemploiAdvisor.email,
            type: capemploiAdvisor.type,
          },
        ],
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
      await conventionFranceTravailAdvisorRepository.openSlotForNextConvention(
        franceTravailFirstUserAdvisor,
      );
      await conventionFranceTravailAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userFtExternalId,
      );

      expectToEqual(
        await db.selectFrom("partners_pe_connect").selectAll().execute(),
        [
          {
            user_pe_external_id:
              franceTravailFirstUserAdvisor.user.peExternalId,
            convention_id: conventionId,
            email: placementAdvisor.email,
            firstname: placementAdvisor.firstName,
            lastname: placementAdvisor.lastName,
            type: placementAdvisor.type,
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
      await conventionFranceTravailAdvisorRepository.openSlotForNextConvention(
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
      await conventionFranceTravailAdvisorRepository.openSlotForNextConvention(
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

      await conventionFranceTravailAdvisorRepository.openSlotForNextConvention(
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
        (await db.selectFrom("partners_pe_connect").selectAll().execute())
          .length,
      ).toBe(1);

      await conventionFranceTravailAdvisorRepository.deleteByConventionId(
        conventionId,
      );

      expect(
        (await conventionRepository.getById(conventionId))?.signatories
          .beneficiary.federatedIdentity,
      ).toBeUndefined();
      expectToEqual(
        await db.selectFrom("partners_pe_connect").selectAll().execute(),
        [],
      );
    });
  });
});
