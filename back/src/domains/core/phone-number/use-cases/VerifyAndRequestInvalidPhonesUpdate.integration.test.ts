import type { Pool } from "pg";
import {
  defaultPhoneNumber,
  expectArraysToEqualIgnoringOrder,
  expectObjectInArrayToMatch,
  expectToEqual,
  type PhoneNumber,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../config/pg/pgPool";
import { PgOutboxQueries } from "../../events/adapters/PgOutboxQueries";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../events/ports/EventBus";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { createPgUow } from "../../unit-of-work/adapters/createPgUow";
import { PgUowPerformer } from "../../unit-of-work/adapters/PgUowPerformer";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { getPhoneNumbers } from "../adapters/pgPhoneHelper";
import { insertPhoneNumber } from "../adapters/pgPhoneTestFileHelper";
import type { PhoneToUpdate } from "./UpdateInvalidPhone";
import {
  makeVerifyAndRequestInvalidPhonesUpdate,
  type PhoneInDB,
  type VerifyAndRequestInvalidPhonesUpdate,
  type VerifyAndRequestInvalidPhonesUpdateReport,
} from "./VerifyAndRequestInvalidPhonesUpdate";

describe("VerifyAndFixPhones", () => {
  let pool: Pool;
  let kyselyDb: KyselyDb;
  let uowPerformer: PgUowPerformer;
  let pgOutbowQueries: PgOutboxQueries;
  let createNewEvent: CreateNewEvent;
  let timeGateway: TimeGateway;
  let now: Date;
  let uuidGenerator: UuidV4Generator;

  const correctPhoneNumber: PhoneNumber = "+33555689727";
  const fixablePhoneNumber: PhoneNumber = "+32784423078";
  const fixedPhoneNumber: PhoneNumber = "+33784423078";
  const unfixablePhoneNumber: PhoneNumber = "+33728661119";

  let verifyAndRequestInvalidPhonesUpdate: VerifyAndRequestInvalidPhonesUpdate;

  beforeAll(async () => {
    pool = makeTestPgPool();
    kyselyDb = makeKyselyDb(pool);
    uowPerformer = new PgUowPerformer(kyselyDb, createPgUow);
    pgOutbowQueries = new PgOutboxQueries(kyselyDb);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    timeGateway = new CustomTimeGateway();
    now = timeGateway.now();
    uuidGenerator = new UuidV4Generator();
    createNewEvent = makeCreateNewEvent({ uuidGenerator, timeGateway });
    verifyAndRequestInvalidPhonesUpdate =
      makeVerifyAndRequestInvalidPhonesUpdate({
        deps: { timeGateway, kyselyDb, uowPerformer, createNewEvent },
      });

    await kyselyDb.deleteFrom("outbox_failures").execute();
    await kyselyDb.deleteFrom("outbox_publications").execute();
    await kyselyDb.deleteFrom("outbox").execute();
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

  describe("Test utilitary function", () => {
    it("Insert not verified phone in db", async () => {
      const notVerifiedPhoneId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: correctPhoneNumber,
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [
        {
          id: notVerifiedPhoneId,
          phoneNumber: correctPhoneNumber,
          verifiedAt: null,
        },
      ]);
    });

    it("Insert verified phone in db", async () => {
      const notVerifiedPhoneId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: correctPhoneNumber,
        verifiedAt: now,
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [
        {
          id: notVerifiedPhoneId,
          phoneNumber: correctPhoneNumber,
          verifiedAt: now,
        },
      ]);
    });
  });
  describe("Right path", () => {
    it("Do not modify a correct phone", async () => {
      const correctPhoneNumberId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: correctPhoneNumber,
      });

      const report = await verifyAndRequestInvalidPhonesUpdate.execute();

      const correctPhoneInDB: PhoneInDB = {
        id: correctPhoneNumberId,
        phoneNumber: correctPhoneNumber,
        verifiedAt: now,
      };

      expectToEqual(report, {
        nbOfCorrectPhones: 1,
        nbOfFixedPhones: 0,
        nbOfPhonesSetToDefault: 0,
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [correctPhoneInDB]);
      expectObjectInArrayToMatch(
        await pgOutbowQueries.getEventsToPublish({ limit: 100 }),
        [],
      );
    });

    it("Update a fixable phone number", async () => {
      const fixablePhoneNumberId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: fixablePhoneNumber,
      });
      const currentFixablePhone: PhoneInDB = {
        id: fixablePhoneNumberId,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
      };
      const fixablePhoneToUpdate: PhoneToUpdate = {
        currentPhone: currentFixablePhone,
        newPhoneNumber: fixedPhoneNumber,
      };

      const report = await verifyAndRequestInvalidPhonesUpdate.execute();

      expectToEqual(report, {
        nbOfCorrectPhones: 0,
        nbOfFixedPhones: 1,
        nbOfPhonesSetToDefault: 0,
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [currentFixablePhone]);
      expectObjectInArrayToMatch(
        await pgOutbowQueries.getEventsToPublish({ limit: 100 }),
        [
          {
            topic: "InvalidPhoneUpdateRequested",
            payload: {
              phoneToUpdate: fixablePhoneToUpdate,
              triggeredBy: { kind: "crawler" },
            },
          },
        ],
      );
    });

    it("Update an unfixable phone number with default value", async () => {
      const unfixablePhoneNumberId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: unfixablePhoneNumber,
      });
      const currentUnfixablePhone: PhoneInDB = {
        id: unfixablePhoneNumberId,
        phoneNumber: unfixablePhoneNumber,
        verifiedAt: null,
      };
      const unfixablePhoneToUpdate: PhoneToUpdate = {
        currentPhone: currentUnfixablePhone,
        newPhoneNumber: defaultPhoneNumber,
      };

      const report = await verifyAndRequestInvalidPhonesUpdate.execute();

      expectToEqual(report, {
        nbOfCorrectPhones: 0,
        nbOfFixedPhones: 0,
        nbOfPhonesSetToDefault: 1,
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [currentUnfixablePhone]);
      expectObjectInArrayToMatch(
        await pgOutbowQueries.getEventsToPublish({ limit: 100 }),
        [
          {
            topic: "InvalidPhoneUpdateRequested",
            payload: {
              phoneToUpdate: unfixablePhoneToUpdate,
              triggeredBy: { kind: "crawler" },
            },
          },
        ],
      );
    });

    it("Does not modify a correct phone, fix a fixable phone number, and update an unfixable phone number with default value", async () => {
      const correctPhoneNumberId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: correctPhoneNumber,
      });
      const fixablePhoneNumberId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: fixablePhoneNumber,
      });
      const unfixablePhoneNumberId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: unfixablePhoneNumber,
      });
      const currentCorrectPhone: PhoneInDB = {
        id: correctPhoneNumberId,
        phoneNumber: correctPhoneNumber,
        verifiedAt: now,
      };
      const currentFixablePhone: PhoneInDB = {
        id: fixablePhoneNumberId,
        phoneNumber: fixablePhoneNumber,
        verifiedAt: null,
      };
      const currentUnfixablePhone: PhoneInDB = {
        id: unfixablePhoneNumberId,
        phoneNumber: unfixablePhoneNumber,
        verifiedAt: null,
      };

      const fixablePhoneToUpdate: PhoneToUpdate = {
        currentPhone: currentFixablePhone,
        newPhoneNumber: fixedPhoneNumber,
      };
      const unfixablePhoneToUpdate: PhoneToUpdate = {
        currentPhone: currentUnfixablePhone,
        newPhoneNumber: defaultPhoneNumber,
      };

      const report = await verifyAndRequestInvalidPhonesUpdate.execute();

      expectToEqual(report, {
        nbOfCorrectPhones: 1,
        nbOfFixedPhones: 1,
        nbOfPhonesSetToDefault: 1,
      });
      expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), [
        currentCorrectPhone,
        currentFixablePhone,
        currentUnfixablePhone,
      ]);
      expectObjectInArrayToMatch(
        await pgOutbowQueries.getEventsToPublish({ limit: 100 }),
        [
          {
            topic: "InvalidPhoneUpdateRequested",
            payload: {
              phoneToUpdate: fixablePhoneToUpdate,
              triggeredBy: { kind: "crawler" },
            },
          },
          {
            topic: "InvalidPhoneUpdateRequested",
            payload: {
              phoneToUpdate: unfixablePhoneToUpdate,
              triggeredBy: { kind: "crawler" },
            },
          },
        ],
      );
    });

    it("Consider default phone number as valid", async () => {
      const defaultPhoneNumberId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: defaultPhoneNumber,
      });
      const currentDefaultPhone: PhoneInDB = {
        id: defaultPhoneNumberId,
        phoneNumber: defaultPhoneNumber,
        verifiedAt: null,
      };

      const report = await verifyAndRequestInvalidPhonesUpdate.execute();

      expectToEqual(report, {
        nbOfCorrectPhones: 1,
        nbOfFixedPhones: 0,
        nbOfPhonesSetToDefault: 0,
      });
      expectArraysToEqualIgnoringOrder(await getPhoneNumbers(kyselyDb), [
        { ...currentDefaultPhone, verifiedAt: now },
      ]);
      expectObjectInArrayToMatch(
        await pgOutbowQueries.getEventsToPublish({ limit: 100 }),
        [],
      );
    });

    it("Verify a phone that has been verified before", async () => {
      const firstVerificationDate: Date = new Date("2025-01-01");
      const correctPhoneNumberId = await insertPhoneNumber(kyselyDb, {
        phoneNumber: correctPhoneNumber,
        verifiedAt: firstVerificationDate,
      });

      const report = await verifyAndRequestInvalidPhonesUpdate.execute();

      const correctPhoneInDB: PhoneInDB = {
        id: correctPhoneNumberId,
        phoneNumber: correctPhoneNumber,
        verifiedAt: now,
      };

      expectToEqual(report, {
        nbOfCorrectPhones: 1,
        nbOfFixedPhones: 0,
        nbOfPhonesSetToDefault: 0,
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), [correctPhoneInDB]);
      expectObjectInArrayToMatch(
        await pgOutbowQueries.getEventsToPublish({ limit: 100 }),
        [],
      );
    });
  });

  describe("Wrong path", () => {
    it("Return empty report and do not affect data when there are no phone numbers in DB", async () => {
      const report: VerifyAndRequestInvalidPhonesUpdateReport =
        await verifyAndRequestInvalidPhonesUpdate.execute();

      expectToEqual(report, {
        nbOfCorrectPhones: 0,
        nbOfFixedPhones: 0,
        nbOfPhonesSetToDefault: 0,
      });

      expectToEqual(await getPhoneNumbers(kyselyDb), []);
      expectObjectInArrayToMatch(
        await pgOutbowQueries.getEventsToPublish({ limit: 100 }),
        [],
      );
    });

    it("Throw if kysely not defined", async () => {
      verifyAndRequestInvalidPhonesUpdate =
        makeVerifyAndRequestInvalidPhonesUpdate({
          deps: { timeGateway, kyselyDb: null, uowPerformer, createNewEvent },
        });

      await expect(
        verifyAndRequestInvalidPhonesUpdate.execute(),
      ).rejects.toThrow();
    });
  });
});
