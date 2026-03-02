import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/max";
import { getSupportedCountryCodesForCountry, type PhoneNumber } from "shared";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { useCaseBuilder } from "../../useCaseBuilder";

export type PhoneInDB = {
  id: number;
  phoneNumber: PhoneNumber;
};

type FixPhonesReport = {
  correctPhonesInDB: PhoneInDB[];
  fixedPhonesInDB: PhoneInDB[];
  conflictingPhonesInDB: PhoneInDB[];
};

export const defaultPhoneNumber: PhoneNumber = "+33600000000";

export type VerifyAndFixPhones = ReturnType<typeof makeVerifyAndFixPhone>;

export const makeVerifyAndFixPhone = useCaseBuilder("VerifyAndFixPhones")
  .withDeps<{ kyselyDb: KyselyDb }>()
  .withOutput<FixPhonesReport>()
  .notTransactional()
  .build(async ({ deps }) => {
    const report: FixPhonesReport = {
      correctPhonesInDB: [],
      fixedPhonesInDB: [],
      conflictingPhonesInDB: [],
    };

    const phoneNumbersToVerify = await getPhoneNumbers(deps.kyselyDb);
    const existingPhoneNumbers = new Set(
      phoneNumbersToVerify.map((p) => p.phoneNumber),
    );

    phoneNumbersToVerify.forEach((pn) => {
      if (isValidPhoneNumber(pn.phoneNumber)) {
        report.correctPhonesInDB.push(pn);
        return;
      }

      const resolvedPhoneNumber: PhoneNumber =
        fixPhoneNumberCountryCode(pn.phoneNumber) ?? defaultPhoneNumber;

      const resolvedPhone: PhoneInDB = {
        ...pn,
        phoneNumber: resolvedPhoneNumber,
      };

      if (existingPhoneNumbers.has(resolvedPhoneNumber)) {
        report.conflictingPhonesInDB.push(resolvedPhone);
        return;
      }

      existingPhoneNumbers.add(resolvedPhoneNumber);
      report.fixedPhonesInDB.push(resolvedPhone);
    });

    await fixPhones(deps.kyselyDb, report.fixedPhonesInDB);

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

export const getPhoneNumbers = async (
  kyselyDb: KyselyDb,
): Promise<PhoneInDB[]> => {
  return await kyselyDb
    .selectFrom("phone_numbers")
    .select(["id", "phone_number as phoneNumber"])
    .execute();
};

const fixPhones = async (
  kyselyDb: KyselyDb,
  phonesToFix: PhoneInDB[],
): Promise<{ fixedPhoneIds: number[] }> => {
  if (phonesToFix.length === 0) return { fixedPhoneIds: [] };

  const results = await kyselyDb
    .insertInto("phone_numbers")
    .values(
      phonesToFix.map((pn) => ({ id: pn.id, phone_number: pn.phoneNumber })),
    )
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => ({
        phone_number: eb.ref("excluded.phone_number"),
      })),
    )
    .returning("id")
    .execute();

  return {
    fixedPhoneIds: results.map((res) => res.id),
  };
};
