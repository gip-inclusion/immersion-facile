import { Pool, PoolClient } from "pg";
import {
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  expectArraysToEqualIgnoringOrder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  formEstablishementUpdateFailedErrorMessage,
  formEstablishmentNotFoundErrorMessage,
} from "../../../../domain/offer/ports/FormEstablishmentRepository";
import {
  ConflictError,
  NotFoundError,
} from "../../../primary/helpers/httpErrors";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
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
        businessAddress: formEstablishment.businessAddress,
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
