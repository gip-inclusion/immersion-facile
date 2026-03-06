import type { Flavor } from "../typeFlavors";

export type PhoneNumber = Flavor<string, "Phone">;

export const defaultPhoneNumber: PhoneNumber = "+33600000000";
