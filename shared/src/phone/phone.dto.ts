import type { Flavor } from "../typeFlavors";

export type PhoneNumber = Flavor<string, "Phone">;

export const phoneStatus = ["NOT_VERIFIED", "UPDATE_PENDING", "VALID"] as const;
export type PhoneStatus = (typeof phoneStatus)[number];

export type Phone = {
  id: number;
  phoneNumber: PhoneNumber;
  verifiedAt: Date | null;
  status: PhoneStatus;
};

export const defaultPhoneNumber: PhoneNumber = "+33600000000";
