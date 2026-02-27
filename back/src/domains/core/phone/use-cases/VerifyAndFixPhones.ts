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
  unfixablePhonesInDB: PhoneInDB[];
};

export const defaultPhoneNumber = "+33600000000";

export type VerifyAndFixPhones = ReturnType<typeof makeVerifyAndFixPhone>;

export const makeVerifyAndFixPhone = useCaseBuilder("VerifyAndFixPhones")
  .withDeps<{ kyselyDb: KyselyDb }>()
  .withOutput<FixPhonesReport>()
  .notTransactional()
  .build(async ({ deps }) => {
    const report: FixPhonesReport = {
      correctPhonesInDB: [],
      fixedPhonesInDB: [],
      unfixablePhonesInDB: [],
    };

    const phoneNumbersToVerify = await getPhoneNumbers(deps.kyselyDb);
    phoneNumbersToVerify.forEach((phoneNumberToVerify) => {
      if (isValidPhoneNumber(phoneNumberToVerify.phoneNumber)) {
        report.correctPhonesInDB.push(phoneNumberToVerify);
        return;
      }

      const fixedPhoneNumber = fixPhoneNumberCountryCode(
        phoneNumberToVerify.phoneNumber,
      );

      if (fixedPhoneNumber) {
        report.fixedPhonesInDB.push({
          ...phoneNumberToVerify,
          phoneNumber: fixedPhoneNumber,
        });
        return;
      }

      report.unfixablePhonesInDB.push({
        ...phoneNumberToVerify,
        phoneNumber: defaultPhoneNumber,
      });
    });

    await fixPhones(deps.kyselyDb, report.fixedPhonesInDB);
    await fixPhones(deps.kyselyDb, report.unfixablePhonesInDB);

    return report;

    // for (const table of sourceTables) {
    //   let phonesBatch: PhoneInDB[] = [];
    //   let page = 1;
    //   const perPage = 5;

    //   do {
    //     const batchReport: FixPhonesReport = {
    //       correctPhonesInDB: [],
    //       fixedPhonesInDB: [],
    //       unfixablePhonesInDB: [],
    //     };

    //     phonesBatch = await deps.getPhonesToVerify(table, page, perPage);

    //     phonesBatch.forEach((phone) => {
    //       if (isValidPhoneNumber(phone.phoneNumber)) {
    //         batchReport.correctPhonesInDB.push(phone);
    //       }

    //       const fixedPhoneNumber = fixPhoneNumberCountryCode(phone.phoneNumber);

    //       if (!isValidPhoneNumber(phone.phoneNumber) && fixedPhoneNumber) {
    //         batchReport.fixedPhonesInDB.push({
    //           ...phone,
    //           phoneNumber: fixedPhoneNumber,
    //         });
    //       }

    //       if (!isValidPhoneNumber(phone.phoneNumber) && !fixedPhoneNumber) {
    //         batchReport.unfixablePhonesInDB.push({
    //           ...phone,
    //           phoneNumber: defaultPhoneNumber,
    //         });
    //       }
    //     });

    //     await deps.updatePhones(batchReport.fixedPhonesInDB, table);
    //     await deps.updatePhones(batchReport.unfixablePhonesInDB, table);

    //     report.correctPhonesInDB.push(...batchReport.correctPhonesInDB);
    //     report.fixedPhonesInDB.push(...batchReport.fixedPhonesInDB);
    //     report.unfixablePhonesInDB.push(...batchReport.unfixablePhonesInDB);

    //     page++;
    //   } while (phonesBatch.length > 0);
    // }

    // return report;
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

const getPhoneNumbers = async (kyselyDb: KyselyDb): Promise<PhoneInDB[]> => {
  return await kyselyDb
    .selectFrom("phone_numbers")
    .select(["id", "phone_number as phoneNumber"])
    .execute();
};

const fixPhones = async (
  kyselyDb: KyselyDb,
  phonesToFix: PhoneInDB[],
): Promise<void> => {
  await kyselyDb
    .insertInto("phone_numbers")
    .values(
      phonesToFix.map((pn) => ({ id: pn.id, phone_number: pn.phoneNumber })),
    )
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => ({
        phone_number: eb.ref("excluded.phone_number"),
      })),
    )
    .execute();
};
