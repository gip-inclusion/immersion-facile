import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/max";
import { getSupportedCountryCodesForCountry } from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { PhoneQueries } from "../ports/PhoneQueries";

export type PhoneInDB = {
  phoneNumber: string;
  phoneLabelInTable: string;
  sourceTable: string;
  relatedId: string;
};

type FixPhonesReport = {
  correctPhonesInDB: PhoneInDB[];
  fixedPhonesInDB: PhoneInDB[];
  unfixablePhonesInDB: PhoneInDB[];
};

export const defaultPhoneNumber = "+33600000000";

export type VerifyAndFixPhones = ReturnType<typeof makeVerifyAndFixPhone>;

export const makeVerifyAndFixPhone = useCaseBuilder("VerifyAndFixPhones")
  .withDeps<PhoneQueries>()
  .withOutput<FixPhonesReport>()
  .notTransactional()
  .build(async ({ deps }) => {
    const phonesInDB = await deps.getPhonesToVerify();

    const correctPhonesInDB: PhoneInDB[] = [];
    const unfixablePhonesInDB: PhoneInDB[] = [];
    const fixedPhonesInDB: PhoneInDB[] = [];

    phonesInDB.map((phone) => {
      if (isValidPhoneNumber(phone.phoneNumber)) {
        correctPhonesInDB.push(phone);
        return;
      }

      const fixedPhoneNumber = fixPhoneNumberCountryCode(phone.phoneNumber);
      if (fixedPhoneNumber) {
        fixedPhonesInDB.push({ ...phone, phoneNumber: fixedPhoneNumber });
        return;
      }

      unfixablePhonesInDB.push({ ...phone, phoneNumber: defaultPhoneNumber });
    });

    await deps.fixPhones(fixedPhonesInDB);
    await deps.fixPhones(unfixablePhonesInDB);

    return { correctPhonesInDB, fixedPhonesInDB, unfixablePhonesInDB };
  });

const fixPhoneNumberCountryCode = (phoneNumber: string): string | undefined => {
  const phoneNumberWithoutCountryCode = `0${parsePhoneNumber(phoneNumber).nationalNumber.toString()}`;

  const newCountryCode = getSupportedCountryCodesForCountry("FR").find(
    (countryCode) => {
      return isValidPhoneNumber(phoneNumberWithoutCountryCode, countryCode);
    },
  );

  if (!newCountryCode) {
    return undefined;
  }

  const fixedPhoneNumber = parsePhoneNumber(
    phoneNumberWithoutCountryCode,
    newCountryCode,
  ).format("E.164");

  if (!isValidPhoneNumber(fixedPhoneNumber)) {
    return undefined;
  }

  return fixedPhoneNumber;
};
