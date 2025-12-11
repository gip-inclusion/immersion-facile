import { expectToEqual } from "shared";
import { InMemoryPhoneQueries } from "../adapters/InMemoryPhoneQueries";
import {
  defaultPhoneNumber,
  makeVerifyAndFixPhone,
  type PhoneInDB,
  type VerifyAndFixPhones,
} from "./VerifyAndFixPhones";

describe("VerifyAndFixPhones", () => {
  const correctPhoneInDB: PhoneInDB = {
    phoneLabelInTable: "abc",
    phoneNumber: "+33784423078",
    relatedId: "1234",
    sourceTable: "agencies",
  };

  const fixablePhoneInDB: PhoneInDB = {
    phoneNumber: "+33696257064",
    phoneLabelInTable: "potential_beneficiary_phone",
    sourceTable: "discussions",
    relatedId: "13b51d36-146a-41f8-8ded-cde7aef50c8r",
  };

  const unfixablePhoneInDB: PhoneInDB = {
    phoneNumber: "+33728661119",
    phoneLabelInTable: "potential_beneficiary_phone",
    sourceTable: "discussions",
    relatedId: "b4fd563e-3fa9-468b-ac4a-5f1f3868e631",
  };

  let inMemoryPhoneQueries: InMemoryPhoneQueries;
  let verifyAndFixPhones: VerifyAndFixPhones;

  beforeEach(() => {
    inMemoryPhoneQueries = new InMemoryPhoneQueries();
    verifyAndFixPhones = makeVerifyAndFixPhone({
      deps: inMemoryPhoneQueries,
    });
  });

  it("Correct phone", async () => {
    inMemoryPhoneQueries.setPhones([correctPhoneInDB], "discussions");
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
      unfixablePhonesInDB: [
        { ...unfixablePhoneInDB, phoneNumber: defaultPhoneNumber },
      ],
    });

    expectToEqual(inMemoryPhoneQueries.getPhones("discussions"), [
      { ...unfixablePhoneInDB, phoneNumber: defaultPhoneNumber },
    ]);
  });
});
