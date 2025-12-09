import type { PhoneQueries } from "../ports/PhoneQueries";
import type { PhoneInDB } from "../use-cases/VerifyAndFixPhones";

export class InMemoryPhoneQueries implements PhoneQueries {
  #phones: PhoneInDB[] = [];

  setPhones(phones: PhoneInDB[]) {
    this.#phones = phones;
  }

  getPhones(): PhoneInDB[] {
    return this.#phones;
  }

  async getPhonesToVerify(): Promise<PhoneInDB[]> {
    return this.#phones;
  }

  async fixPhones(fixedPhones: PhoneInDB[]): Promise<void> {
    fixedPhones.map((fixedPhone) => {
      const phoneToFix = this.#phones.find(
        (phone) => phone.relatedId === fixedPhone.relatedId,
      );

      if (!phoneToFix) return;

      phoneToFix.phoneNumber = fixedPhone.phoneNumber;
    });
  }
}
