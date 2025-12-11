import type { Pool } from "pg";
import { DiscussionBuilder, type DiscussionDto, expectToEqual } from "shared";
import {
	type KyselyDb,
	makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../config/pg/pgPool";
import { PgDiscussionRepository } from "../../../establishment/adapters/PgDiscussionRepository";
import type { PhoneQueries } from "../ports/PhoneQueries";
import {
	defaultPhoneNumber,
	type PhoneInDB,
} from "../use-cases/VerifyAndFixPhones";
import { PgPhoneQueries } from "./PgPhoneQueries";

describe("PG VerifyAndFixPhones", () => {
	const fixablePhoneNumber = "+33696257064";
	const unfixablePhoneNumber = "+33728661119";

	const discussionWithFixablePhoneNumber = new DiscussionBuilder()
		.withId("00000000-0000-0000-0000-000000000001")
		.withCreatedAt(new Date("2024-01-01"))
		.withDiscussionKind("IF")
		.withSiret("00000000000002")
		.withPotentialBeneficiaryPhone(fixablePhoneNumber)
		.build();

	const fixablePhoneDiscussionInDB: PhoneInDB = {
		phoneNumber: fixablePhoneNumber,
		phoneLabelInTable: "potential_beneficiary_phone",
		sourceTable: "discussions",
		relatedId: discussionWithFixablePhoneNumber.id,
	};

	const discussionWithUnfixablePhoneNumber = new DiscussionBuilder()
		.withId("00000000-0000-0000-0000-000000000002")
		.withCreatedAt(new Date("2024-01-01"))
		.withSiret("00000000000003")
		.withPotentialBeneficiaryPhone(unfixablePhoneNumber)
		.build();

	const unfixablePhoneDiscussionInDB: PhoneInDB = {
		phoneNumber: unfixablePhoneNumber,
		phoneLabelInTable: "potential_beneficiary_phone",
		sourceTable: "discussions",
		relatedId: discussionWithUnfixablePhoneNumber.id,
	};

	let pool: Pool;
	let db: KyselyDb;
	let phoneQueries: PhoneQueries;

	let discussionRepository: PgDiscussionRepository;

	beforeAll(async () => {
		pool = makeTestPgPool();
		db = makeKyselyDb(pool);
		phoneQueries = new PgPhoneQueries(db);
		discussionRepository = new PgDiscussionRepository(db);
	});

	beforeEach(async () => {
		await db.deleteFrom("discussions").execute();
		await db.deleteFrom("api_consumers").execute();
		await db.deleteFrom("conventions").execute();
		await db.deleteFrom("agencies").execute();
		await db.deleteFrom("actors").execute();
		await db.deleteFrom("establishments__users").execute();
		await db.deleteFrom("notifications_sms").execute();
	});

	afterAll(async () => {
		await pool.end();
	});

	it("Fixable phone number", async () => {
		await discussionRepository.insert(discussionWithFixablePhoneNumber);
		const fixedPhoneNumber = "+596696257064";

		const fixedPhoneInDB: PhoneInDB = {
			...fixablePhoneDiscussionInDB,
			phoneNumber: fixedPhoneNumber,
		};

		const discussionWithFixedPhoneNumber: DiscussionDto = {
			...discussionWithFixablePhoneNumber,
			kind: "IF",
			potentialBeneficiary: {
				...discussionWithFixablePhoneNumber.potentialBeneficiary,
				phone: fixedPhoneNumber,
			},
		};

		await phoneQueries.updatePhones([fixedPhoneInDB], "discussions");

		const actualDiscussions = await discussionRepository.getDiscussions({
			filters: {},
			limit: 1000,
		});
		expectToEqual(actualDiscussions, [discussionWithFixedPhoneNumber]);
	});

	it("Unfixable phone number", async () => {
		await discussionRepository.insert(discussionWithUnfixablePhoneNumber);

		const unfixablePhoneWithDefaultNumberInDB: PhoneInDB = {
			...unfixablePhoneDiscussionInDB,
			phoneNumber: defaultPhoneNumber,
		};

		const discussionWithDefaultPhoneNumber: DiscussionDto = {
			...discussionWithUnfixablePhoneNumber,
			kind: "IF",
			potentialBeneficiary: {
				...discussionWithUnfixablePhoneNumber.potentialBeneficiary,
				phone: defaultPhoneNumber,
			},
		};

		await phoneQueries.updatePhones(
			[unfixablePhoneWithDefaultNumberInDB],
			"discussions",
		);

		const actualDiscussions = await discussionRepository.getDiscussions({
			filters: {},
			limit: 1000,
		});
		expectToEqual(actualDiscussions, [discussionWithDefaultPhoneNumber]);
	});
});
