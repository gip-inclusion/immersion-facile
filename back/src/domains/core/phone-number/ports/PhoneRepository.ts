import type { Phone, PhoneNumber, PhoneVerificationStatus } from "shared";
import type { Database } from "../../../../config/pg/kysely/model/database";
import type { PhoneId } from "../adapters/pgPhoneHelper";
import type { UpdatePhonePayload } from "../use-cases/UpdateInvalidPhone";

export type SafeUpdatePhoneParams = Pick<
  Phone,
  "verifiedAt" | "verificationStatus"
>;

export const tablesWithPhoneReference = [
  "discussions",
  "agencies",
  "api_consumers",
  "establishments__users",
  "actors",
] as const satisfies (keyof Database)[];

export type TablesWithPhoneReference =
  (typeof tablesWithPhoneReference)[number];

export interface PhoneRepository {
  getConflictingPhoneNumberId(params: {
    phoneNumber: PhoneNumber;
  }): Promise<number | null>;
  fixConflictingPhoneUpdate(params: {
    updatePhonePayload: UpdatePhonePayload;
    conflictingPhoneNumberId: number;
  }): Promise<void>;
  fixNotConflictingPhone(params: {
    updatePhonePayload: UpdatePhonePayload;
  }): Promise<void>;
  getPhoneNumbers(params: {
    verifiedBefore?: Date;
    limit?: number;
    verificationStatus?: PhoneVerificationStatus[];
    fromId?: PhoneId;
  }): Promise<{ phones: Phone[]; cursorId: number | null }>;
  markAsVerified(params: {
    phoneIds: PhoneId[];
    verifiedDate: Date;
  }): Promise<void>;
  updateVerificationStatus(params: {
    phoneIds: PhoneId[];
    verificationStatus: PhoneVerificationStatus;
  }): Promise<void>;
  getTableNamesReferencingPhoneNumbers(): Promise<(keyof Database)[]>;
}
