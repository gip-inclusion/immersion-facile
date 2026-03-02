import type { Pool } from "pg";
import { expectToEqual, type PhoneNumber } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../config/pg/pgPool";
import {
  defaultPhoneNumber,
  getPhoneNumbers,
  makeVerifyAndFixPhone,
  type PhoneInDB,
  type VerifyAndFixPhones,
} from "./VerifyAndFixPhones";

describe("VerifyAndFixPhones", () => {
  let pool: Pool;
  let kyselyDb: KyselyDb;

  const insertPhoneNumber = async (
    phoneNumber: PhoneNumber,
  ): Promise<number> => {
    const result = await kyselyDb
      .insertInto("phone_numbers")
      .values({ phone_number: phoneNumber })
      .returning("phone_numbers.id")
      .executeTakeFirstOrThrow();
    return result.id;
  };
  const correctPhoneNumber: PhoneNumber = "+33555689727";
  const fixablePhoneNumber: PhoneNumber = "+32784423078";
  const fixedPhoneNumber: PhoneNumber = "+33784423078";
  const unfixablePhoneNumber1: PhoneNumber = "+33728661119";
  const unfixablePhoneNumber2: PhoneNumber = "+33728661120";

  let verifyAndFixPhones: VerifyAndFixPhones;

  beforeAll(async () => {
    pool = makeTestPgPool();
    kyselyDb = makeKyselyDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    verifyAndFixPhones = makeVerifyAndFixPhone({
      deps: { kyselyDb },
    });

    await kyselyDb.deleteFrom("discussions").execute();
    await kyselyDb.deleteFrom("convention_drafts").execute();
    await kyselyDb.deleteFrom("convention_templates").execute();
    await kyselyDb.deleteFrom("conventions").execute();
    await kyselyDb.deleteFrom("agencies").execute();
    await kyselyDb.deleteFrom("actors").execute();
    await kyselyDb.deleteFrom("api_consumers").execute();
    await kyselyDb.deleteFrom("establishments__users").execute();
    await kyselyDb.deleteFrom("phone_numbers").execute();
  });

  describe("Right paths", () => {
    it("Return empty report when there are no phone numbers in DB", async () => {
      const report = await verifyAndFixPhones.execute();

      expectToEqual(report, {
        correctPhonesInDB: [],
        fixedPhonesInDB: [],
        conflictingPhonesInDB: [],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), []);
    });

    it("Do not modify a correct phone", async () => {
      const correctPhoneNumberId = await insertPhoneNumber(correctPhoneNumber);

      const correctPhoneInDB: PhoneInDB = {
        id: correctPhoneNumberId,
        phoneNumber: correctPhoneNumber,
      };

      const report = await verifyAndFixPhones.execute();

      expectToEqual(report, {
        correctPhonesInDB: [correctPhoneInDB],
        fixedPhonesInDB: [],
        conflictingPhonesInDB: [],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [correctPhoneInDB]);
    });

    it("Fix a fixable phone number", async () => {
      const fixablePhoneNumberId = await insertPhoneNumber(fixablePhoneNumber);

      const report = await verifyAndFixPhones.execute();

      const fixedPhoneInDB: PhoneInDB = {
        id: fixablePhoneNumberId,
        phoneNumber: fixedPhoneNumber,
      };

      expectToEqual(report, {
        correctPhonesInDB: [],
        fixedPhonesInDB: [fixedPhoneInDB],
        conflictingPhonesInDB: [],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [fixedPhoneInDB]);
    });

    it("Update an unfixable phone number with default value", async () => {
      const unfixablePhoneNumberId = await insertPhoneNumber(
        unfixablePhoneNumber1,
      );

      const report = await verifyAndFixPhones.execute();

      const defaultPhoneInDB: PhoneInDB = {
        id: unfixablePhoneNumberId,
        phoneNumber: defaultPhoneNumber,
      };

      expectToEqual(report, {
        correctPhonesInDB: [],
        fixedPhonesInDB: [defaultPhoneInDB],
        conflictingPhonesInDB: [],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [defaultPhoneInDB]);
    });

    it("Do not modify a correct phone, fix a fixable phone number, and update an unfixable phone number with default value", async () => {
      const correctPhoneNumberId = await insertPhoneNumber(correctPhoneNumber);
      const fixablePhoneNumberId = await insertPhoneNumber(fixablePhoneNumber);
      const unfixablePhoneNumberId = await insertPhoneNumber(
        unfixablePhoneNumber1,
      );

      const report = await verifyAndFixPhones.execute();

      const correctPhoneInDB: PhoneInDB = {
        id: correctPhoneNumberId,
        phoneNumber: correctPhoneNumber,
      };
      const fixedPhoneInDB: PhoneInDB = {
        id: fixablePhoneNumberId,
        phoneNumber: fixedPhoneNumber,
      };
      const defaultPhoneInDB: PhoneInDB = {
        id: unfixablePhoneNumberId,
        phoneNumber: defaultPhoneNumber,
      };

      expectToEqual(report, {
        correctPhonesInDB: [correctPhoneInDB],
        fixedPhonesInDB: [fixedPhoneInDB, defaultPhoneInDB],
        conflictingPhonesInDB: [],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [
        correctPhoneInDB,
        fixedPhoneInDB,
        defaultPhoneInDB,
      ]);
    });

    it("Do not modify anything when run a second time after fixing an unfixable phone number", async () => {
      const unfixableId = await insertPhoneNumber(unfixablePhoneNumber1);

      await verifyAndFixPhones.execute();
      const report = await verifyAndFixPhones.execute();

      const defaultPhoneInDB: PhoneInDB = {
        id: unfixableId,
        phoneNumber: defaultPhoneNumber,
      };

      expectToEqual(report, {
        correctPhonesInDB: [defaultPhoneInDB],
        fixedPhonesInDB: [],
        conflictingPhonesInDB: [],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [defaultPhoneInDB]);
    });

    it("Do not modify anything when run second time", async () => {
      const fixablePhoneNumberId = await insertPhoneNumber(fixablePhoneNumber);

      await verifyAndFixPhones.execute();
      const report = await verifyAndFixPhones.execute();

      const correctPhoneInDB: PhoneInDB = {
        id: fixablePhoneNumberId,
        phoneNumber: fixedPhoneNumber,
      };

      expectToEqual(report, {
        correctPhonesInDB: [correctPhoneInDB],
        fixedPhonesInDB: [],
        conflictingPhonesInDB: [],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [correctPhoneInDB]);
    });
  });

  describe("Wrong paths", () => {
    it("Create conflict when fixing one phone number", async () => {
      const defaultPhoneNumberId = await insertPhoneNumber(defaultPhoneNumber);
      const unfixablePhoneNumberId = await insertPhoneNumber(
        unfixablePhoneNumber1,
      );

      const report = await verifyAndFixPhones.execute();

      const defaultPhoneInDB: PhoneInDB = {
        id: defaultPhoneNumberId,
        phoneNumber: defaultPhoneNumber,
      };
      const unfixablePhoneInDB: PhoneInDB = {
        id: unfixablePhoneNumberId,
        phoneNumber: unfixablePhoneNumber1,
      };
      const conflictingPhonesInDB: PhoneInDB = {
        id: unfixablePhoneNumberId,
        phoneNumber: defaultPhoneNumber,
      };

      expectToEqual(report, {
        correctPhonesInDB: [defaultPhoneInDB],
        fixedPhonesInDB: [],
        conflictingPhonesInDB: [conflictingPhonesInDB],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [
        defaultPhoneInDB,
        unfixablePhoneInDB,
      ]);
    });

    it("Fix first unfixable phone to defaultPhoneNumber, put second unfixable in conflict", async () => {
      const unfixablePhoneNumberId1 = await insertPhoneNumber(
        unfixablePhoneNumber1,
      );
      const unfixablePhoneNumberId2 = await insertPhoneNumber(
        unfixablePhoneNumber2,
      );

      const report = await verifyAndFixPhones.execute();

      const fixedAsDefaultPhoneInDB: PhoneInDB = {
        id: unfixablePhoneNumberId1,
        phoneNumber: defaultPhoneNumber,
      };
      const conflictingPhoneInDB: PhoneInDB = {
        id: unfixablePhoneNumberId2,
        phoneNumber: defaultPhoneNumber,
      };

      expectToEqual(report, {
        correctPhonesInDB: [],
        fixedPhonesInDB: [fixedAsDefaultPhoneInDB],
        conflictingPhonesInDB: [conflictingPhoneInDB],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [
        { id: unfixablePhoneNumberId2, phoneNumber: unfixablePhoneNumber2 },
        fixedAsDefaultPhoneInDB,
      ]);
    });

    it("Put all unfixable phones in conflict when defaultPhoneNumber already exists in DB", async () => {
      const defaultPhoneNumberId = await insertPhoneNumber(defaultPhoneNumber);
      const unfixablePhoneNumberId = await insertPhoneNumber(
        unfixablePhoneNumber1,
      );
      const unfixablePhoneNumberId2 = await insertPhoneNumber(
        unfixablePhoneNumber2,
      );

      const report = await verifyAndFixPhones.execute();

      const defaultPhoneInDB: PhoneInDB = {
        id: defaultPhoneNumberId,
        phoneNumber: defaultPhoneNumber,
      };
      const conflictingPhone1: PhoneInDB = {
        id: unfixablePhoneNumberId,
        phoneNumber: defaultPhoneNumber,
      };
      const conflictingPhone2: PhoneInDB = {
        id: unfixablePhoneNumberId2,
        phoneNumber: defaultPhoneNumber,
      };

      expectToEqual(report, {
        correctPhonesInDB: [defaultPhoneInDB],
        fixedPhonesInDB: [],
        conflictingPhonesInDB: [conflictingPhone1, conflictingPhone2],
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [
        defaultPhoneInDB,
        { id: unfixablePhoneNumberId, phoneNumber: unfixablePhoneNumber1 },
        { id: unfixablePhoneNumberId2, phoneNumber: unfixablePhoneNumber2 },
      ]);
    });
  });
});
