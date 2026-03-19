import {
  type DateTimeIsoString,
  dateTimeIsoStringSchema,
  type Phone,
  type PhoneNumber,
  phoneNumberSchema,
} from "shared";
import z from "zod";
import { type TriggeredBy, triggeredBySchema } from "../../events/events";
import { useCaseBuilder } from "../../useCaseBuilder";
import { phoneInDBSchema } from "./VerifyAndRequestInvalidPhonesUpdate";

export type UpdatePhonePayload = {
  currentPhone: Phone;
  newPhoneNumber: PhoneNumber;
  newVerificationDate: DateTimeIsoString;
  triggeredBy: TriggeredBy;
};

const updatePhonePayloadSchema = z.object({
  currentPhone: phoneInDBSchema,
  newPhoneNumber: phoneNumberSchema,
  newVerificationDate: dateTimeIsoStringSchema,
  triggeredBy: triggeredBySchema,
});

export type UpdateInvalidPhone = ReturnType<typeof makeUpdateInvalidPhone>;

export const makeUpdateInvalidPhone = useCaseBuilder("UpdateInvalidPhone")
  .withInput<UpdatePhonePayload>(updatePhonePayloadSchema)
  .build(async ({ inputParams: updatePhonePayload, uow }) => {
    if (
      updatePhonePayload.currentPhone.phoneNumber ===
      updatePhonePayload.newPhoneNumber
    )
      return;

    const conflictingPhoneNumberId =
      await uow.phoneRepository.getConflictingPhoneNumberId({
        updatePhonePayload,
      });

    conflictingPhoneNumberId
      ? await uow.phoneRepository.fixConflictingPhoneUpdate({
          updatePhonePayload,
          conflictingPhoneNumberId,
        })
      : await uow.phoneRepository.fixNotConflictingPhone({
          updatePhonePayload,
          verificationDate: new Date(updatePhonePayload.newVerificationDate),
        });
  });
