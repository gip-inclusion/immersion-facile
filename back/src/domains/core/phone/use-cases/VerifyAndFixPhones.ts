import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/max";
import {
	type ExtractFromExisting,
	getSupportedCountryCodesForCountry,
} from "shared";
import type { Database } from "../../../../config/pg/kysely/model/database";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { PhoneQueries } from "../ports/PhoneQueries";

export type PhoneInDB = {
	phoneNumber: string;
	phoneLabelInTable: string;
	sourceTable: ExtractFromExisting<
		keyof Database,
		| "discussions"
		| "agencies"
		| "actors"
		| "api_consumers"
		| "establishments__users"
		| "notifications_sms"
	>;
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

		const initialReport: FixPhonesReport = {
			correctPhonesInDB: [],
			fixedPhonesInDB: [],
			unfixablePhonesInDB: [],
		};

		const result = phonesInDB.reduce((acc, phone) => {
			if (isValidPhoneNumber(phone.phoneNumber)) {
				acc.correctPhonesInDB.push(phone);
				return acc;
			}

			const fixedPhoneNumber = fixPhoneNumberCountryCode(phone.phoneNumber);
			if (fixedPhoneNumber) {
				acc.fixedPhonesInDB.push({ ...phone, phoneNumber: fixedPhoneNumber });
				return acc;
			}

			acc.unfixablePhonesInDB.push({
				...phone,
				phoneNumber: defaultPhoneNumber,
			});
			return acc;
		}, initialReport);

		await deps.updatePhones(result.fixedPhonesInDB);
		await deps.updatePhones(result.unfixablePhonesInDB);

		return result;
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
