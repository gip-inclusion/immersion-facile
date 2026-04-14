import { addDays, subDays } from "date-fns";
import {
  defaultPhoneNumber,
  expectArraysToMatch,
  expectToEqual,
  type Phone,
  type PhoneNumber,
} from "shared";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../events/ports/EventBus";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeVerifyAndRequestInvalidPhonesUpdate,
  type VerifyAndRequestInvalidPhonesUpdate,
} from "./VerifyAndRequestInvalidPhonesUpdate";

describe("VerifyAndRequestInvalidPhonesUpdate", () => {
  let createNewEvent: CreateNewEvent;
  let timeGateway: TimeGateway;
  let uuidGenerator: UuidV4Generator;
  let uow: InMemoryUnitOfWork;
  let now: Date;

  let verifyAndRequestInvalidPhonesUpdate: VerifyAndRequestInvalidPhonesUpdate;

  const correctPhoneNumber: PhoneNumber = "+33555689727";
  const fixablePhoneNumber: PhoneNumber = "+32784423078";
  const fixedPhoneNumber: PhoneNumber = "+33784423078";
  const unfixablePhoneNumber: PhoneNumber = "+33728661119";

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    now = timeGateway.now();
    uuidGenerator = new UuidV4Generator();
    createNewEvent = makeCreateNewEvent({ uuidGenerator, timeGateway });
    uow = createInMemoryUow();
    verifyAndRequestInvalidPhonesUpdate =
      makeVerifyAndRequestInvalidPhonesUpdate({
        deps: {
          timeGateway,
          createNewEvent,
          uowPerformer: new InMemoryUowPerformer(uow),
        },
      });
  });

  it("Marks as verified a correct phone, fix a fixable phone number, and update an unfixable phone number with default value and reports correctly", async () => {
    const correctPhone: Phone = {
      id: 1,
      phoneNumber: correctPhoneNumber,
      verifiedAt: null,
      status: "NOT_VERIFIED",
    };
    const fixablePhone: Phone = {
      id: 2,
      phoneNumber: fixablePhoneNumber,
      verifiedAt: null,
      status: "NOT_VERIFIED",
    };
    const unfixablePhone: Phone = {
      id: 3,
      phoneNumber: unfixablePhoneNumber,
      verifiedAt: null,
      status: "NOT_VERIFIED",
    };

    uow.phoneRepository.phones = [correctPhone, fixablePhone, unfixablePhone];

    const report = await verifyAndRequestInvalidPhonesUpdate.execute({
      dateToVerifyBefore: now,
    });

    expectToEqual(uow.phoneRepository.phones, [
      {
        ...correctPhone,
        verifiedAt: now,
        status: "VALID",
      },
      {
        ...fixablePhone,
        verifiedAt: now,
        status: "UPDATE_PENDING",
      },
      {
        ...unfixablePhone,
        verifiedAt: now,
        status: "UPDATE_PENDING",
      },
    ]);
    expectArraysToMatch(uow.outboxRepository.events, [
      {
        topic: "InvalidPhoneUpdateRequested",
        priority: 7,
        payload: {
          phoneIdToUpdate: fixablePhone.id,
          newPhoneNumber: fixedPhoneNumber,
          triggeredBy: { kind: "crawler" },
        },
      },
      {
        topic: "InvalidPhoneUpdateRequested",
        priority: 7,
        payload: {
          phoneIdToUpdate: unfixablePhone.id,
          newPhoneNumber: defaultPhoneNumber,
          triggeredBy: { kind: "crawler" },
        },
      },
    ]);
    expectToEqual(report, {
      nbOfCorrectPhones: 1,
      nbOfFixedPhones: 1,
      nbOfPhonesSetToDefault: 1,
    });
  });

  it("Does not verify phones that have been verified after the input date", async () => {
    const dateToVerifyBefore = subDays(now, 5);

    const correctPhone: Phone = {
      id: 1,
      phoneNumber: correctPhoneNumber,
      verifiedAt: subDays(dateToVerifyBefore, 5),
      status: "VALID",
    };
    const fixablePhone: Phone = {
      id: 2,
      phoneNumber: fixablePhoneNumber,
      verifiedAt: addDays(dateToVerifyBefore, 1),
      status: "VALID",
    };
    const unfixablePhone: Phone = {
      id: 3,
      phoneNumber: unfixablePhoneNumber,
      verifiedAt: addDays(dateToVerifyBefore, 1),
      status: "VALID",
    };

    uow.phoneRepository.phones = [correctPhone, fixablePhone, unfixablePhone];

    const report = await verifyAndRequestInvalidPhonesUpdate.execute({
      dateToVerifyBefore,
    });

    expectToEqual(uow.phoneRepository.phones, [
      { ...correctPhone, verifiedAt: now },
      fixablePhone,
      unfixablePhone,
    ]);
    expectArraysToMatch(uow.outboxRepository.events, []);
    expectToEqual(report, {
      nbOfCorrectPhones: 1,
      nbOfFixedPhones: 0,
      nbOfPhonesSetToDefault: 0,
    });
  });

  it("Verifies a phone that has been verified before the input date", async () => {
    const phone: Phone = {
      id: 1,
      phoneNumber: correctPhoneNumber,
      verifiedAt: subDays(now, 10),
      status: "VALID",
    };

    uow.phoneRepository.phones = [phone];

    const report = await verifyAndRequestInvalidPhonesUpdate.execute({
      dateToVerifyBefore: now,
    });

    expectToEqual(uow.phoneRepository.phones, [{ ...phone, verifiedAt: now }]);
    expectArraysToMatch(uow.outboxRepository.events, []);
    expectToEqual(report, {
      nbOfCorrectPhones: 1,
      nbOfFixedPhones: 0,
      nbOfPhonesSetToDefault: 0,
    });
  });

  it("Returns empty report and does not affect data when there are no phone numbers in DB", async () => {
    const report = await verifyAndRequestInvalidPhonesUpdate.execute({
      dateToVerifyBefore: now,
    });
    expectToEqual(uow.phoneRepository.phones, []);
    expectArraysToMatch(uow.outboxRepository.events, []);
    expectToEqual(report, {
      nbOfCorrectPhones: 0,
      nbOfFixedPhones: 0,
      nbOfPhonesSetToDefault: 0,
    });
  });
});
