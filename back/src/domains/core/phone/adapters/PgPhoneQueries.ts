import { sql } from "kysely";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { PhoneQueries } from "../ports/PhoneQueries";
import type {
	PhoneInDB,
	PhoneSourceTable,
} from "../use-cases/VerifyAndFixPhones";

export class PgPhoneQueries implements PhoneQueries {
	constructor(private transaction: KyselyDb) {}

	async getPhonesToVerify(
		tableName: PhoneSourceTable,
		page: number,
		perPage: number,
	): Promise<PhoneInDB[]> {
		const startIndex = (page - 1) * perPage;

		switch (tableName) {
			case "discussions": {
				const phonesInDB: PhoneInDB[] = await this.transaction
					.selectFrom("discussions")
					.select([
						"potential_beneficiary_phone as phoneNumber",
						sql<string>`'potential_beneficiary_phone'`.as("phoneLabelInTable"),
						sql<PhoneSourceTable>`'discussions'`.as("sourceTable"),
						sql<string>`id::text`.as("relatedId"),
					])
					.limit(perPage)
					.offset(startIndex)
					.execute();
				return phonesInDB;
			}
			case "actors": {
				const phonesInDB = await this.transaction
					.selectFrom("actors")
					.select([
						"phone as phoneNumber",
						sql<string>`'phone'`.as("phoneLabelInTable"),
						sql<PhoneSourceTable>`'actors'`.as("sourceTable"),
						sql<string>`id::text`.as("relatedId"),
					])
					.limit(perPage)
					.offset(startIndex)
					.execute();
				return phonesInDB;
			}
			case "agencies": {
				const phonesInDB = await this.transaction
					.selectFrom("agencies")
					.select([
						"phone_number as phoneNumber",
						sql<string>`'phone_number'`.as("phoneLabelInTable"),
						sql<PhoneSourceTable>`'agencies'`.as("sourceTable"),
						sql<string>`id::text`.as("relatedId"),
					])
					.limit(perPage)
					.offset(startIndex)
					.execute();
				return phonesInDB;
			}
			case "establishments__users": {
				const phonesInDB = await this.transaction
					.selectFrom("establishments__users")
					.select([
						sql<string>`phone`.as("phoneNumber"),
						sql<string>`'phone'`.as("phoneLabelInTable"),
						sql<PhoneSourceTable>`'establishments__users'`.as("sourceTable"),
						sql<string>`user_id::text`.as("relatedId"),
					])
					.where("phone", "is not", null)
					.limit(perPage)
					.offset(startIndex)
					.execute();
				return phonesInDB;
			}
			case "api_consumers": {
				const phonesInDB = await this.transaction
					.selectFrom("api_consumers")
					.select([
						"contact_phone as phoneNumber",
						sql<string>`'contact_phone'`.as("phoneLabelInTable"),
						sql<PhoneSourceTable>`'api_consumers'`.as("sourceTable"),
						sql<string>`id::text`.as("relatedId"),
					])
					.limit(perPage)
					.offset(startIndex)
					.execute();
				return phonesInDB;
			}
			case "notifications_sms": {
				const phonesInDB = await this.transaction
					.selectFrom("notifications_sms")
					.select([
						"recipient_phone as phoneNumber",
						sql<string>`'recipient_phone'`.as("phoneLabelInTable"),
						sql<PhoneSourceTable>`'notifications_sms'`.as("sourceTable"),
						sql<string>`id::text`.as("relatedId"),
					])
					.limit(perPage)
					.offset(startIndex)
					.execute();
				return phonesInDB;
			}

			default:
				return [];
		}
	}

	async updatePhones(
		phones: PhoneInDB[],
		tableName: PhoneSourceTable,
	): Promise<void> {
		if (phones.length === 0) return;

		switch (tableName) {
			case "discussions": {
				await Promise.all(
					phones.map((phone) =>
						this.transaction
							.updateTable("discussions")
							.set({ potential_beneficiary_phone: phone.phoneNumber })
							.where("id", "=", phone.relatedId)
							.execute(),
					),
				);
				break;
			}

			case "actors": {
				await Promise.all(
					phones.map((phone) =>
						this.transaction
							.updateTable("actors")
							.set({ phone: phone.phoneNumber })
							.where("id", "=", Number(phone.relatedId))
							.execute(),
					),
				);
				break;
			}

			case "agencies": {
				await Promise.all(
					phones.map((phone) =>
						this.transaction
							.updateTable("agencies")
							.set({ phone_number: phone.phoneNumber })
							.where("id", "=", phone.relatedId)
							.execute(),
					),
				);
				break;
			}

			case "establishments__users": {
				await Promise.all(
					phones.map((phone) =>
						this.transaction
							.updateTable("establishments__users")
							.set({ phone: phone.phoneNumber })
							.where("user_id", "=", phone.relatedId)
							.execute(),
					),
				);
				break;
			}

			case "api_consumers": {
				await Promise.all(
					phones.map((phone) =>
						this.transaction
							.updateTable("api_consumers")
							.set({ contact_phone: phone.phoneNumber })
							.where("id", "=", phone.relatedId)
							.execute(),
					),
				);
				break;
			}

			case "notifications_sms": {
				await Promise.all(
					phones.map((phone) =>
						this.transaction
							.updateTable("notifications_sms")
							.set({ recipient_phone: phone.phoneNumber })
							.where("id", "=", phone.relatedId)
							.execute(),
					),
				);
				break;
			}
		}
	}
}
