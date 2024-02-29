import { Pool, PoolClient } from "pg";
import {
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  expectArraysToEqualIgnoringOrder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  ConflictError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import {
  formEstablishementUpdateFailedErrorMessage,
  formEstablishmentNotFoundErrorMessage,
} from "../ports/FormEstablishmentRepository";
import { PgFormEstablishmentRepository } from "./PgFormEstablishmentRepository";

describe("PgFormEstablishmentRepository", () => {
  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSource("lesentreprises-sengagent")
    .withSiret("88888888888888")
    .withMaxContactsPerWeek(8)
    .withBusinessAddresses([
      {
        id: "364efc5a-db4f-452c-8d20-95c6a23f21fe",
        rawAddress: "1 rue de la paix, 75001 Paris",
      },
      {
        id: "22d4aaed-c79a-4f9d-b65f-3e232f7cb8cd",
        rawAddress: "45 rue des oligarques, 75008 Paris",
      },
      {
        id: "11111111-1111-4444-1111-111111111111",
        rawAddress: "12 rue de la liberté, 75011 Paris",
      },
    ])
    .build();

  let pool: Pool;
  let client: PoolClient;
  let formEstablishmentRepository: PgFormEstablishmentRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM form_establishments");
    formEstablishmentRepository = new PgFormEstablishmentRepository(
      makeKyselyDb(pool),
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("save & get", () => {
    it("Adds a new FormEstablishment", async () => {
      await formEstablishmentRepository.create(formEstablishment);

      expectToEqual(
        await formEstablishmentRepository.getBySiret(formEstablishment.siret),
        formEstablishment,
      );
    });

    it("Gets saved Form Establishment", async () => {
      const siretA = "11111111111111";
      const formEstablishmentA = FormEstablishmentDtoBuilder.valid()
        .withSource("lesentreprises-sengagent")
        .withSiret(siretA)
        .withNextAvailabilityDate(new Date())
        .build();

      const siretB = "22222222222222";
      const formEstablishmentB = FormEstablishmentDtoBuilder.valid()
        .withFitForDisabledWorkers(true)
        .withSiret(siretB)
        .build();

      await formEstablishmentRepository.create(formEstablishmentA);
      await formEstablishmentRepository.create(formEstablishmentB);

      const resultA = await formEstablishmentRepository.getBySiret(siretA);
      expect(resultA).toEqual(formEstablishmentA);

      const resultAll = await formEstablishmentRepository.getAll();
      expectArraysToEqualIgnoringOrder(resultAll, [
        formEstablishmentA,
        formEstablishmentB,
      ]);
    });
  });

  describe("update", () => {
    it("update all fields if establishment indeed exists", async () => {
      await formEstablishmentRepository.create(formEstablishment);

      expectToEqual(await formEstablishmentRepository.getAll(), [
        formEstablishment,
      ]);

      const updatedFormEstablishment: FormEstablishmentDto = {
        ...formEstablishment,
        businessName: "newName",
        fitForDisabledWorkers: true,
        additionalInformation: "toto",
        naf: {
          code: "32132",
          nomenclature: "yolo",
        },
        businessNameCustomized: "billy",
        isEngagedEnterprise: true,
        website: "http://web.site",
        nextAvailabilityDate: new Date().toISOString(),
      };
      await formEstablishmentRepository.update(updatedFormEstablishment);
      expectToEqual(await formEstablishmentRepository.getAll(), [
        updatedFormEstablishment,
      ]);

      const minimalFormEstablishment: FormEstablishmentDto = {
        siret: formEstablishment.siret,
        appellations: formEstablishment.appellations,
        businessAddresses: formEstablishment.businessAddresses,
        businessContact: formEstablishment.businessContact,
        businessName: formEstablishment.businessName,
        maxContactsPerWeek: formEstablishment.maxContactsPerWeek,
        source: formEstablishment.source,
        searchableBy: formEstablishment.searchableBy,
      };
      await formEstablishmentRepository.update(minimalFormEstablishment);
      expectToEqual(await formEstablishmentRepository.getAll(), [
        minimalFormEstablishment,
      ]);
    });

    it("establishment does not exist", async () => {
      await expectPromiseToFailWithError(
        formEstablishmentRepository.update(formEstablishment),
        new ConflictError(
          formEstablishementUpdateFailedErrorMessage(formEstablishment),
        ),
      );
    });
  });

  describe("delete", () => {
    it("delete establishment", async () => {
      await formEstablishmentRepository.create(formEstablishment);

      await formEstablishmentRepository.delete(formEstablishment.siret);

      expectToEqual(await formEstablishmentRepository.getAll(), []);
    });

    it("establishment not found", async () => {
      await expectPromiseToFailWithError(
        formEstablishmentRepository.delete(formEstablishment.siret),
        new NotFoundError(
          formEstablishmentNotFoundErrorMessage(formEstablishment.siret),
        ),
      );
    });
  });
});
