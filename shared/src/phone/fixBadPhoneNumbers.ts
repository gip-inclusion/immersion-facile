import fs from "fs";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/max";
import { getSupportedCountryCodesForCountry } from "../address/address.dto";

type PhoneInDB = {
  phone_number: string;
  phone_label_in_table: string;
  source_table: string;
  related_id: string;
};

export const verifyAndFixPhoneInDBFromJsonFile = (
  jsonFileUri: string,
): {
  correctPhonesInDB: PhoneInDB[];
  fixedPhonesInDB: { phoneInDB: PhoneInDB; fixedPhoneNumber: string }[];
  unfixablePhonesInDB: PhoneInDB[];
} => {
  const fileContent = fs.readFileSync(jsonFileUri, "utf8");
  const phonesInDB: PhoneInDB[] = JSON.parse(fileContent);
  return verifyAndFixPhonesInDB(phonesInDB);
};

export const verifyAndFixPhonesInDB = (
  phonesInDB: PhoneInDB[],
): {
  correctPhonesInDB: PhoneInDB[];
  fixedPhonesInDB: { phoneInDB: PhoneInDB; fixedPhoneNumber: string }[];
  unfixablePhonesInDB: PhoneInDB[];
} => {
  const correctPhonesInDB: PhoneInDB[] = [];
  const unfixablePhonesInDB: PhoneInDB[] = [];
  const fixedPhonesInDB: { phoneInDB: PhoneInDB; fixedPhoneNumber: string }[] =
    [];

  phonesInDB.map((phone) => {
    if (isValidPhoneNumber(phone.phone_number)) {
      correctPhonesInDB.push(phone);
      return;
    }

    const fixedPhoneNumber = fixPhoneNumberCountryCode(phone.phone_number);
    if (fixedPhoneNumber) {
      fixedPhonesInDB.push({ phoneInDB: phone, fixedPhoneNumber });
      return;
    }

    unfixablePhonesInDB.push(phone);
  });
  return { correctPhonesInDB, fixedPhonesInDB, unfixablePhonesInDB };
};

export const fixPhoneNumberCountryCode = (
  phoneNumber: string,
): string | undefined => {
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
