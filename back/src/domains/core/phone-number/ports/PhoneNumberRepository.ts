import type { PhoneNumber, PhoneNumberId } from "shared";

export interface PhoneNumberRepository {
  getIdByPhoneNumber(phone: PhoneNumber, now: Date): Promise<PhoneNumberId>;
}
