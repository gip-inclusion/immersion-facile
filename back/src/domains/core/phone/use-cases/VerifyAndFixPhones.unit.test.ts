import { expectToEqual } from "shared";
import {
  defaultPhoneNumber,
  makeVerifyAndFixPhone,
  type PhoneInDB,
  type VerifyAndFixPhones,
} from "./VerifyAndFixPhones";

describe("VerifyAndFixPhones", () => {
  const correctPhoneInDB: PhoneInDB = {
    phoneNumber: "+33784423078",
    id: 1,
  };

  const fixablePhoneInDB: PhoneInDB = {
    phoneNumber: "+33696257064",
    id: 2,
  };

  const unfixablePhoneInDB: PhoneInDB = {
    phoneNumber: "+33728661119",
    id: 3,
  };

  let verifyAndFixPhones: VerifyAndFixPhones;

  beforeEach(() => {
    verifyAndFixPhones = makeVerifyAndFixPhone({
      deps: { kyselyDb },
    });
  });

  it("Correct phone", async () => {
    const report = await verifyAndFixPhones.execute();

    expectToEqual(report, {
      correctPhonesInDB: [correctPhoneInDB],
      fixedPhonesInDB: [],
      unfixablePhonesInDB: [],
    });

    expectToEqual(inMemoryPhoneQueries.getPhones("discussions"), [
      correctPhoneInDB,
    ]);
  });

  it("Fixable phone number", async () => {
    inMemoryPhoneQueries.setPhones([fixablePhoneInDB], "discussions");

    const report = await verifyAndFixPhones.execute();

    const fixedPhoneInDB: PhoneInDB = {
      ...fixablePhoneInDB,
      phoneNumber: "+596696257064",
    };

    expectToEqual(report, {
      correctPhonesInDB: [],
      fixedPhonesInDB: [fixedPhoneInDB],
      unfixablePhonesInDB: [],
    });

    expectToEqual(inMemoryPhoneQueries.getPhones("discussions"), [
      fixedPhoneInDB,
    ]);
  });

  it("Unfixable phone number", async () => {
    inMemoryPhoneQueries.setPhones([unfixablePhoneInDB], "discussions");

    const report = await verifyAndFixPhones.execute();

    expectToEqual(report, {
      correctPhonesInDB: [],
      fixedPhonesInDB: [],
      unfixablePhonesInDB: [unfixablePhoneInDB],
    });

    expectToEqual(inMemoryPhoneQueries.getPhones("discussions"), [
      { ...unfixablePhoneInDB, phoneNumber: defaultPhoneNumber },
    ]);
  });
});
