import type { Phone, PhoneNumber, PhoneStatus } from "shared";
import type { Database } from "../../../../config/pg/kysely/model/database";
import type { PhoneId } from "../adapters/pgPhoneHelper";

export const tablesWithPhoneReference = [
  "discussions",
  "agencies",
  "api_consumers",
  "establishments__users",
  "actors",
] as const satisfies (keyof Database)[];

export type TablesWithPhoneReference =
  (typeof tablesWithPhoneReference)[number];

export type FixConflictingPhoneParams = {
  phoneToUpdate: Phone;
  newPhoneNumber: PhoneNumber;
  conflictingPhoneId: PhoneId;
};

export type FixNotConflictingPhoneParams = {
  phoneToUpdate: Phone;
  newPhoneNumber: PhoneNumber;
};

export interface PhoneRepository {
  getConflictingPhoneNumberId(params: {
    phoneNumber: PhoneNumber;
  }): Promise<number | null>;
  fixConflictingPhone(params: FixConflictingPhoneParams): Promise<void>;
  fixNotConflictingPhone(params: FixNotConflictingPhoneParams): Promise<void>;
  getPhones(params: {
    verifiedBefore?: Date;
    limit?: number;
    verificationStatus?: PhoneStatus[];
    fromId?: PhoneId;
  }): Promise<{ phones: Phone[]; cursorId: number | null }>;
  getPhoneById(id: PhoneId): Promise<Phone | undefined>;
  markAsVerified(params: {
    phoneIds: PhoneId[];
    verifiedDate: Date;
  }): Promise<void>;
  updateStatus(params: {
    phoneIds: PhoneId[];
    status: PhoneStatus;
  }): Promise<void>;
}
