import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/max";
import { partition } from "ramda";
import {
  defaultPhoneNumber,
  getSupportedCountryCodesForCountry,
  phoneVerificationStatus,
} from "shared";
import z from "zod";
import type { TriggeredBy } from "../../events/events";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { UpdatePhonePayload } from "./UpdateInvalidPhone";

export const phoneInDBSchema = z.object({
  id: z.number(),
  phoneNumber: z.string(),
  verifiedAt: z.date().nullable(),
  verificationStatus: z.enum(phoneVerificationStatus),
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
    createNewEvent: CreateNewEvent;
  }>()
  .withInput(z.object({ dateToVerifyBefore: z.date() }))
  .withOutput<VerifyAndRequestInvalidPhonesUpdateReport>()
  .build(
    async ({ deps: { timeGateway, createNewEvent }, uow, inputParams }) => {
      const triggeredUseCaseDate = timeGateway.now();
      const report: VerifyAndRequestInvalidPhonesUpdateReport = {
        nbOfCorrectPhones: 0,
        nbOfFixedPhones: 0,
        nbOfPhonesSetToDefault: 0,
      };
      let fromId: number | undefined;
      let hasMore = true;

      while (hasMore) {
        const { phones: phoneNumbersToVerify, cursorId } =
          await uow.phoneRepository.getPhoneNumbers({
            limit: 10_000,
            verifiedBefore: inputParams.dateToVerifyBefore,
            verificationStatus: ["NOT_VERIFIED", "VERIFICATION_COMPLETED"],
            fromId,
          });

        const verifiedPhoneNumbers: {
          updatePhonePayload: UpdatePhonePayload;
          isValid: boolean;
        }[] = phoneNumbersToVerify.map((pn) => {
          const verifiedAt = triggeredUseCaseDate.toISOString();
          const triggeredBy = { kind: "crawler" } satisfies TriggeredBy;

          const isValid = isValidPhoneNumber(pn.phoneNumber);

          if (isValid) {
            return {
              updatePhonePayload: {
                currentPhone: {
                  id: pn.id,
                  phoneNumber: pn.phoneNumber,
                  verifiedAt: pn.verifiedAt,
                  verificationStatus: "VERIFICATION_COMPLETED",
                },
                newPhoneNumber: pn.phoneNumber,
                newVerificationDate: verifiedAt,
                triggeredBy,
              },
              isValid,
            } satisfies {
              updatePhonePayload: UpdatePhonePayload;
              isValid: boolean;
            };
          }

          const resolvedPhone = fixPhoneNumberCountryCode(pn.phoneNumber);
          const updatePhonePayload: UpdatePhonePayload = {
            currentPhone: {
              id: pn.id,
              phoneNumber: pn.phoneNumber,
              verifiedAt: pn.verifiedAt,
              verificationStatus: "PENDING_VERIFICATION",
            },
            newPhoneNumber: resolvedPhone ?? defaultPhoneNumber,
            newVerificationDate: verifiedAt,
            triggeredBy,
          };
          return {
            updatePhonePayload,
            isValid,
          };
        });

        const [validPhoneList, invalidPhoneList] = partition(
          ({ isValid }) => isValid,
          verifiedPhoneNumbers,
        );

        const invalidPhonesToUpdateEvents = invalidPhoneList.map(
          ({ updatePhonePayload }) => {
            return createNewEvent({
              topic: "InvalidPhoneUpdateRequested",
              payload: updatePhonePayload,
            });
          },
        );
        await uow.outboxRepository.saveNewEventsBatch(
          invalidPhonesToUpdateEvents,
        );

        await uow.phoneRepository.markAsVerified({
          phoneIds: validPhoneList.map(
            ({ updatePhonePayload }) => updatePhonePayload.currentPhone.id,
          ),
          verifiedDate: triggeredUseCaseDate,
        });

        await uow.phoneRepository.updateVerificationStatus({
          phoneIds: invalidPhoneList.map(
            ({ updatePhonePayload }) => updatePhonePayload.currentPhone.id,
          ),
          verificationStatus: "PENDING_VERIFICATION",
        });

        const [defaultedPhoneList, fixedPhoneList] = partition(
          ({ updatePhonePayload: { newPhoneNumber } }) =>
            newPhoneNumber === defaultPhoneNumber,
          invalidPhoneList,
        );

        report.nbOfCorrectPhones += validPhoneList.length;
        report.nbOfFixedPhones += fixedPhoneList.length;
        report.nbOfPhonesSetToDefault += defaultedPhoneList.length;

        fromId = cursorId ?? undefined;
        hasMore = cursorId !== null;
      }

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
