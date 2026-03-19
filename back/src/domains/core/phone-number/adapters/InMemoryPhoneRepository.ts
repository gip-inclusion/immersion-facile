import type { Phone, PhoneVerificationStatus } from "shared";
import type { Database } from "../../../../config/pg/kysely/model/database";
import type {
  PhoneRepository,
  SafeUpdatePhoneParams,
} from "../ports/PhoneRepository";
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

  async safeUpdatePhone(
    phoneId: PhoneId,
    params: Partial<SafeUpdatePhoneParams>,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getTableNamesReferencingPhoneNumbers(): Promise<(keyof Database)[]> {
    return [...tablesWithRepoAndPhoneReference];
  }

  async getPhoneNumbers(params: {
    verifiedBefore: Date;
    limit: number;
  }): Promise<Phone[]> {
    return this.phones
      .filter(
        (phone) =>
          !phone.verifiedAt ||
          (phone.verifiedAt && phone.verifiedAt < params.verifiedBefore),
      )
      .slice(0, params.limit);
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
    updatePhonePayload: UpdatePhonePayload;
  }): Promise<number | null> {
    throw new Error("Method not implemented.");

    // const existingPhone = this.phones.find(
    //   (phone) =>
    //     phone.phoneNumber === params.updatePhonePayload.newPhoneNumber &&
    //     phone.id !== params.updatePhonePayload.currentPhone.id,
    // );

    // return existingPhone ? existingPhone.id : null;
  }

  async fixConflictingPhoneUpdate(params: {
    updatePhonePayload: UpdatePhonePayload;
    conflictingPhoneNumberId: number;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async fixNotConflictingPhone(params: {
    updatePhonePayload: UpdatePhonePayload;
    verificationDate: Date;
  }): Promise<{ fixedPhoneId: number } | null> {
    throw new Error("Method not implemented.");
    // const { updatePhonePayload, verificationDate } = params;
    // const phoneIndex = this.phones.findIndex(
    //   (phone) => phone.id === updatePhonePayload.currentPhone.id,
    // );

    // if (phoneIndex === -1) return null;

    // this.phones[phoneIndex] = {
    //   ...this.phones[phoneIndex],
    //   phoneNumber: updatePhonePayload.newPhoneNumber,
    //   verifiedAt: verificationDate,
    //   verificationStatus: "VERIFICATION_COMPLETED",
    // };

    // return { fixedPhoneId: this.phones[phoneIndex].id };
  }
}
