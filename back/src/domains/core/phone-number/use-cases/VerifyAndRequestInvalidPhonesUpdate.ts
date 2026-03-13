import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/max";
import {
  defaultPhoneNumber,
  getSupportedCountryCodesForCountry,
  type PhoneNumber,
} from "shared";
import z from "zod";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { useCaseBuilder } from "../../useCaseBuilder";
import { getPhoneNumbers } from "../adapters/pgPhoneHelper";
import type { PhoneToUpdate } from "./UpdateInvalidPhone";

export type PhoneInDB = {
  id: number;
  phoneNumber: PhoneNumber;
  verifiedAt: Date | null;
};

export const phoneInDBSchema = z.object({
  id: z.number(),
  phoneNumber: z.string(),
  verifiedAt: z.date().nullable(),
});

export type VerifyAndRequestInvalidPhonesUpdateReport = {
  nbOfCorrectPhones: number;
  nbOfFixedPhones: number;
  nbOfPhonesSetToDefault: number;
};

export type VerifyAndRequestInvalidPhonesUpdate = ReturnType<
  typeof makeVerifyAndRequestInvalidPhonesUpdate
>;

export const makeVerifyAndRequestInvalidPhonesUpdate = useCaseBuilder(
  "VerifyAndRequestInvalidPhonesUpdate",
)
  .withDeps<{
    timeGateway: TimeGateway;
    kyselyDb: KyselyDb | null;
    uowPerformer: UnitOfWorkPerformer;
    createNewEvent: CreateNewEvent;
  }>()
  .withOutput<VerifyAndRequestInvalidPhonesUpdateReport>()
  .notTransactional()
  .build(
    async ({
      deps: { kyselyDb, timeGateway, uowPerformer, createNewEvent },
    }) => {
      if (!kyselyDb)
        throw new Error(
          "KyselyDb is null. In memory is not available for this use case",
        );

      const triggeredUseCaseDate = timeGateway.now();

      const phonesToMarkAsVerified: PhoneInDB[] = [];
      const report: VerifyAndRequestInvalidPhonesUpdateReport = {
        nbOfCorrectPhones: 0,
        nbOfFixedPhones: 0,
        nbOfPhonesSetToDefault: 0,
      };

      const phoneNumbersToVerify = await getPhoneNumbers(kyselyDb);

      await Promise.all(
        phoneNumbersToVerify.map(async (pn) => {
          if (isValidPhoneNumber(pn.phoneNumber)) {
            phonesToMarkAsVerified.push(pn);
            report.nbOfCorrectPhones++;
            return;
          }

          const resolvedPhone = fixPhoneNumberCountryCode(pn.phoneNumber);
          const phoneToUpdate: PhoneToUpdate = {
            currentPhone: { ...pn, verifiedAt: null },
            newPhoneNumber: resolvedPhone ?? defaultPhoneNumber,
          };

          await uowPerformer.perform((uow) =>
            uow.outboxRepository.save(
              createNewEvent({
                topic: "InvalidPhoneUpdateRequested",
                payload: {
                  phoneToUpdate,
                  verificationDateISOString: triggeredUseCaseDate.toISOString(),
                  triggeredBy: { kind: "crawler" },
                },
              }),
            ),
          );

          phoneToUpdate.newPhoneNumber === defaultPhoneNumber
            ? report.nbOfPhonesSetToDefault++
            : report.nbOfFixedPhones++;
        }),
      );

      await markAsVerified(
        kyselyDb,
        triggeredUseCaseDate,
        phonesToMarkAsVerified,
      );

      return report;
    },
  );

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

const markAsVerified = async (
  kyselyDb: KyselyDb,
  verifiedDate: Date,
  phonesToMarkAsVerified: PhoneInDB[],
) => {
  if (phonesToMarkAsVerified.length === 0) return;

  const phoneIds = phonesToMarkAsVerified.map((phone) => phone.id);

  await kyselyDb
    .updateTable("phone_numbers")
    .set({ verified_at: verifiedDate })
    .where("id", "in", phoneIds)
    .execute();
};
