import type { Flavor } from "../typeFlavors";

export type PhoneNumber = Flavor<string, "Phone">;
export type PhoneNumberId = Flavor<number, "PhoneNumberId">;
