import type { Phone, PhoneNumber, PhoneVerificationStatus } from "shared";
import type { Database } from "../../../../config/pg/kysely/model/database";
import type { PhoneRepository } from "../ports/PhoneRepository";
import type { UpdatePhonePayload } from "../use-cases/UpdateInvalidPhone";
import type { PhoneId } from "./pgPhoneHelper";

const tablesWithRepoAndPhoneReference = [
  "discussions",
  "agencies",
  "api_consumers",
  "establishments__users",
  "conventions",
] as const satisfies (keyof Database)[];

export type TablesWithRepoAndPhoneReference =
  (typeof tablesWithRepoAndPhoneReference)[number];

export class InMemoryPhoneRepository implements PhoneRepository {
  phones: Phone[] = [];

  async updateVerificationStatus(params: {
    phoneIds: PhoneId[];
    verificationStatus: PhoneVerificationStatus;
  }): Promise<void> {
    const { phoneIds, verificationStatus } = params;

    this.phones = this.phones.map((phone) =>
      phoneIds.includes(phone.id) ? { ...phone, verificationStatus } : phone,
    );
  }

  async getTableNamesReferencingPhoneNumbers(): Promise<(keyof Database)[]> {
    return [...tablesWithRepoAndPhoneReference];
  }

  async getPhoneNumbers(params: {
    verifiedBefore?: Date;
    limit?: number;
    verificationStatus?: PhoneVerificationStatus[];
    fromId?: number;
  }): Promise<{ phones: Phone[]; cursorId: number | null }> {
    const {
      verifiedBefore = new Date(),
      limit = 100,
      verificationStatus,
      fromId,
    } = params;

    const filtered = this.phones
      .filter((phone) => !phone.verifiedAt || phone.verifiedAt < verifiedBefore)
      .filter((phone) =>
        verificationStatus
          ? verificationStatus.includes(phone.verificationStatus)
          : true,
      )
      .filter((phone) => (fromId ? phone.id > fromId : true));

    const hasMore = filtered.length > limit;
    const phones = filtered.slice(0, limit);

    return {
      phones,
      cursorId: hasMore ? phones[phones.length - 1].id : null,
    };
  }

  async markAsVerified(params: {
    phoneIds: PhoneId[];
    verifiedDate: Date;
  }): Promise<void> {
    this.phones = this.phones.map((phone) =>
      params.phoneIds.includes(phone.id)
        ? {
            ...phone,
            verifiedAt: params.verifiedDate,
            verificationStatus: "VERIFICATION_COMPLETED",
          }
        : phone,
    );
  }

  async getConflictingPhoneNumberId(params: {
    phoneNumber: PhoneNumber;
  }): Promise<number | null> {
    throw new Error("Method not implemented.");
  }

  async fixConflictingPhoneUpdate(params: {
    updatePhonePayload: UpdatePhonePayload;
    conflictingPhoneNumberId: number;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async fixNotConflictingPhone(params: {
    updatePhonePayload: UpdatePhonePayload;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
