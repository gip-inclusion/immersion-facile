import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/max";
import {
	type ExtractFromExisting,
	getSupportedCountryCodesForCountry,
} from "shared";
import type { Database } from "../../../../config/pg/kysely/model/database";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { PhoneQueries } from "../ports/PhoneQueries";

export type PhoneSourceTable = ExtractFromExisting<
	keyof Database,
	| "discussions"
	| "agencies"
	| "actors"
	| "api_consumers"
	| "establishments__users"
	| "notifications_sms"
>;

export const sourceTables: PhoneInDB["sourceTable"][] = [
	"discussions",
	"agencies",
	"actors",
	"api_consumers",
	"establishments__users",
	"notifications_sms",
];

export type PhoneInDB = {
	phoneNumber: string;
	phoneLabelInTable: string;
	sourceTable: PhoneSourceTable;
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
		const report: FixPhonesReport = {
			correctPhonesInDB: [],
			fixedPhonesInDB: [],
			unfixablePhonesInDB: [],
		};

		for (const table of sourceTables) {
			let phonesBatch: PhoneInDB[] = [];
			let page = 1;
			const perPage = 5;

			do {
				const batchReport: FixPhonesReport = {
					correctPhonesInDB: [],
					fixedPhonesInDB: [],
					unfixablePhonesInDB: [],
				};

				phonesBatch = await deps.getPhonesToVerify(table, page, perPage);

				phonesBatch.forEach((phone) => {
					if (isValidPhoneNumber(phone.phoneNumber)) {
						batchReport.correctPhonesInDB.push(phone);
						return;
					}

					const fixedPhoneNumber = fixPhoneNumberCountryCode(phone.phoneNumber);

					if (fixedPhoneNumber) {
						batchReport.fixedPhonesInDB.push({
							...phone,
							phoneNumber: fixedPhoneNumber,
						});
						return;
					}

					batchReport.unfixablePhonesInDB.push({
						...phone,
						phoneNumber: defaultPhoneNumber,
					});
				});

				await deps.updatePhones(batchReport.fixedPhonesInDB, table);
				await deps.updatePhones(batchReport.unfixablePhonesInDB, table);

				report.correctPhonesInDB.push(...batchReport.correctPhonesInDB);
				report.fixedPhonesInDB.push(...batchReport.fixedPhonesInDB);
				report.unfixablePhonesInDB.push(...batchReport.unfixablePhonesInDB);

				page++;
			} while (phonesBatch.length > 0);
		}

		return report;
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
