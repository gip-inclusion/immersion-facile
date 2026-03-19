import type { Flavor } from "../typeFlavors";

export type PhoneNumber = Flavor<string, "Phone">;

export const phoneVerificationStatus = [
  "NOT_VERIFIED",
  "PENDING_VERIFICATION",
  "VERIFICATION_COMPLETED",
] as const;
export type PhoneVerificationStatus = (typeof phoneVerificationStatus)[number];

export type Phone = {
  id: number;
  phoneNumber: PhoneNumber;
  verifiedAt: Date | null;
  verificationStatus: PhoneVerificationStatus;
};

export const defaultPhoneNumber: PhoneNumber = "+33600000000";
