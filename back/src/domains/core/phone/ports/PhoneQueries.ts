import type { PhoneInDB } from "../use-cases/VerifyAndFixPhones";

export interface PhoneQueries {
  getPhonesToVerify: () => Promise<PhoneInDB[]>;
  fixPhones: (fixedPhones: PhoneInDB[]) => Promise<void>;
}
