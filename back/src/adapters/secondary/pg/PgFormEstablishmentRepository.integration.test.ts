import { Pool, PoolClient } from "pg";
import {
  expectArraysToEqualIgnoringOrder,
  expectPromiseToFailWithError,
  expectToEqual,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
} from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import {
  formEstablishementUpdateFailedErrorMessage,
  formEstablishmentNotFoundErrorMessage,
} from "../../../domain/immersionOffer/ports/FormEstablishmentRepository";
import { ConflictError, NotFoundError } from "../../primary/helpers/httpErrors";
import { makeKyselyDb } from "./sql/database";
import { PgFormEstablishmentRepository } from "./PgFormEstablishmentRepository";

describe("PgFormEstablishmentRepository", () => {
  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSource("lesentreprises-sengagent")
    .withSiret("88888888888888")
    .withMaxContactsPerWeek(8)
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
      };
      await formEstablishmentRepository.update(updatedFormEstablishment);

      expectToEqual(await formEstablishmentRepository.getAll(), [
        updatedFormEstablishment,
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
