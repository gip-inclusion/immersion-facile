import fs from "fs";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/max";
import { getSupportedCountryCodesForCountry } from "../address/address.dto";

interface PhoneInDB {
	phone_number: string;
	phone_label_in_table: string;
	source_table: string;
	related_id: string;
}

export const verifyAndFixPhoneNumberCountryCodeFromJsonFile = (
	jsonFileUri: string,
): {
	correctPhonesInDB: PhoneInDB[];
	fixedPhonesInDB: { phoneInDB: PhoneInDB; fixedPhoneNumber: string }[];
	unfixablePhonesInDB: PhoneInDB[];
} => {
	const phonesInDB = getPhonesInDBFromJsonFile(jsonFileUri);

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
		if (!fixedPhoneNumber) {
			unfixablePhonesInDB.push(phone);
			return;
		}

		fixedPhonesInDB.push({ phoneInDB: phone, fixedPhoneNumber });
	});
	return { correctPhonesInDB, fixedPhonesInDB, unfixablePhonesInDB };
};

const fixPhoneNumberCountryCode = (phoneNumber: string): string | undefined => {
	const phoneNumberWithoutCountryCode = `0${parsePhoneNumber(phoneNumber).nationalNumber.toString()}`;

	const newCountryCode = getSupportedCountryCodesForCountry("FR").find(
		(countryCode) => {
			console.log(countryCode);
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

	return fixedPhoneNumber;
};

const getPhonesInDBFromJsonFile = (jsonFileUri: string): PhoneInDB[] => {
	const fileContent = fs.readFileSync(jsonFileUri, "utf8");
	const data: PhoneInDB[] = JSON.parse(fileContent);
	return data;
};
