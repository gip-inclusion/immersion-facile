import type { PhoneInDB } from "../use-cases/VerifyAndFixPhones";

export interface PhoneQueries {
  getPhonesToVerify: () => Promise<PhoneInDB[]>;
  updatePhones: (phones: PhoneInDB[]) => Promise<void>;
}
