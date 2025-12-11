import type {
	PhoneInDB,
	PhoneSourceTable,
} from "../use-cases/VerifyAndFixPhones";

export interface PhoneQueries {
	getPhonesToVerify: (
		tableName: PhoneSourceTable,
		page: number,
		perPage: number,
	) => Promise<PhoneInDB[]>;
	updatePhones: (
		phones: PhoneInDB[],
		tableName: PhoneSourceTable,
	) => Promise<void>;
}
