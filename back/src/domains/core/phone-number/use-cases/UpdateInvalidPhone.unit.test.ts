import {
  expectArraysToEqual,
  expectArraysToMatch,
  expectToEqual,
  type Phone,
  type PhoneNumber,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  makeUpdateInvalidPhone,
  type UpdateInvalidPhone,
  type UpdatePhonePayload,
} from "./UpdateInvalidPhone";

describe("UpdateInvalidPhone", () => {
  let updateInvalidPhone: UpdateInvalidPhone;
  let uowPerformer: InMemoryUowPerformer;
  let uow: InMemoryUnitOfWork;

  const correctPhoneNumber: PhoneNumber = "+33555689727";
  const fixablePhoneNumber: PhoneNumber = "+32784423078";
  const fixedPhoneNumber: PhoneNumber = "+33784423078";

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    updateInvalidPhone = makeUpdateInvalidPhone({ uowPerformer });
  });

  it("updates a phone when it's not conflicting with any other phone number", async () => {
    const verifiedAt = new Date("2026-03-23");

    const fixablePhone: Phone = {
      id: 1,
      phoneNumber: fixablePhoneNumber,
      status: "UPDATE_PENDING",
      verifiedAt,
    };

    uow.phoneRepository.phones = [fixablePhone];
    const updatePhonePayload: UpdatePhonePayload = {
      phoneIdToUpdate: fixablePhone.id,
      newPhoneNumber: fixedPhoneNumber,
      triggeredBy: { kind: "crawler" },
    };

    await updateInvalidPhone.execute(updatePhonePayload);

    const fixedPhone: Phone = {
      ...fixablePhone,
      phoneNumber: fixedPhoneNumber,
      status: "VALID",
    };

    expectToEqual(uow.phoneRepository.phones, [fixedPhone]);
  });

  describe("when newPhoneNumber is the same as current phone number", () => {
    it("updates status if status is not VALID ", async () => {
      const correctPhone: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        status: "NOT_VERIFIED",
        verifiedAt: new Date("2026-03-23"),
      };

      const updatePhonePayload: UpdatePhonePayload = {
        phoneIdToUpdate: correctPhone.id,
        newPhoneNumber: correctPhone.phoneNumber,
        triggeredBy: { kind: "crawler" },
      };

      uow.phoneRepository.phones = [correctPhone];

      await updateInvalidPhone.execute(updatePhonePayload);

      expectArraysToEqual(uow.phoneRepository.fixNotConflictingPhoneCalls, [
        { phoneToUpdate: correctPhone, newPhoneNumber: correctPhoneNumber },
      ]);
      expectToEqual(uow.phoneRepository.phones, [
        { ...correctPhone, status: "VALID" },
      ]);
    });

    it("does nothing when status is valid ", async () => {
      const correctPhone: Phone = {
        id: 1,
        phoneNumber: correctPhoneNumber,
        status: "VALID",
        verifiedAt: new Date("2026-03-23"),
      };

      const updatePhonePayload: UpdatePhonePayload = {
        phoneIdToUpdate: correctPhone.id,
        newPhoneNumber: correctPhone.phoneNumber,
        triggeredBy: { kind: "crawler" },
      };

      uow.phoneRepository.phones = [correctPhone];

      await updateInvalidPhone.execute(updatePhonePayload);

      expectToEqual(uow.phoneRepository.phones, [correctPhone]);
      expectToEqual(uow.phoneRepository.fixNotConflictingPhoneCalls, []);
    });
  });

  it("updates a phone when it's conflicting with already existing phone number", async () => {
    const verifiedAt = new Date("2026-03-23");

    const alreadyExistingPhone: Phone = {
      id: 1,
      phoneNumber: fixedPhoneNumber,
      status: "VALID",
      verifiedAt,
    };

    const fixablePhone: Phone = {
      id: 2,
      phoneNumber: fixablePhoneNumber,
      status: "UPDATE_PENDING",
      verifiedAt,
    };

    uow.phoneRepository.phones = [alreadyExistingPhone, fixablePhone];

    const updatePhonePayload: UpdatePhonePayload = {
      phoneIdToUpdate: fixablePhone.id,
      newPhoneNumber: alreadyExistingPhone.phoneNumber,
      triggeredBy: { kind: "crawler" },
    };

    await updateInvalidPhone.execute(updatePhonePayload);

    expectToEqual(uow.phoneRepository.phones, [alreadyExistingPhone]);
    expectArraysToMatch(uow.phoneRepository.fixConflictingPhoneUpdateCalls, [
      {
        phoneToUpdate: fixablePhone,
        newPhoneNumber: updatePhonePayload.newPhoneNumber,
        conflictingPhoneId: alreadyExistingPhone.id,
      },
    ]);
  });
});
