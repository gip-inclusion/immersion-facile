import type { PhoneQueries } from "../ports/PhoneQueries";
import type {
	PhoneInDB,
	PhoneSourceTable,
} from "../use-cases/VerifyAndFixPhones";

export class InMemoryPhoneQueries implements PhoneQueries {
	#phonesDiscussions: PhoneInDB[] = [];
	#phonesActors: PhoneInDB[] = [];

	setPhones(phones: PhoneInDB[], tableName: PhoneSourceTable) {
		switch (tableName) {
			case "discussions":
				this.#phonesDiscussions = phones;
				break;
			case "actors":
				this.#phonesActors = phones;
				break;
		}
	}

	getPhones(tableName: PhoneSourceTable): PhoneInDB[] {
		switch (tableName) {
			case "actors":
				return this.#phonesActors;

			case "discussions":
				return this.#phonesDiscussions;

			default:
				return [];
		}
	}

	async getPhonesToVerify(
		tableName: PhoneSourceTable,
		page: number,
		perPage: number,
	): Promise<PhoneInDB[]> {
		const startIndex = (page - 1) * perPage;
		const endIndex = startIndex + perPage;

		switch (tableName) {
			case "discussions": {
				const phonesBatch = this.#phonesDiscussions.slice(startIndex, endIndex);
				return phonesBatch;
			}

			case "actors": {
				const phonesBatch = this.#phonesActors.slice(startIndex, endIndex);
				return phonesBatch;
			}

			default:
				return [];
		}
	}

	async updatePhones(
		fixedPhones: PhoneInDB[],
		tableName: PhoneSourceTable,
	): Promise<void> {
		switch (tableName) {
			case "discussions": {
				fixedPhones.forEach((fixedPhone) => {
					const phoneToFix = this.#phonesDiscussions.find(
						(phone) => phone.relatedId === fixedPhone.relatedId,
					);

					if (!phoneToFix) return;

					phoneToFix.phoneNumber = fixedPhone.phoneNumber;
				});
				break;
			}

			case "actors": {
				fixedPhones.forEach((fixedPhone) => {
					const phoneToFix = this.#phonesDiscussions.find(
						(phone) => phone.relatedId === fixedPhone.relatedId,
					);

					if (!phoneToFix) return;

					phoneToFix.phoneNumber = fixedPhone.phoneNumber;
				});
				break;
			}

			default:
				break;
		}
	}
}
