import type { PhoneQueries } from "../ports/PhoneQueries";
import type { PhoneInDB } from "../use-cases/VerifyAndFixPhones";

export class InMemoryPhoneQueries implements PhoneQueries {
  #phones: PhoneInDB[] = [];

  set phones(phones: PhoneInDB[]) {
    this.#phones = phones;
  }

  get phones(): PhoneInDB[] {
    return this.#phones;
  }

  async getPhonesToVerify(): Promise<PhoneInDB[]> {
    return this.#phones;
  }

  async updatePhones(fixedPhones: PhoneInDB[]): Promise<void> {
    fixedPhones.map((fixedPhone) => {
      const phoneToFix = this.#phones.find(
        (phone) => phone.relatedId === fixedPhone.relatedId,
      );

      if (!phoneToFix) return;

      phoneToFix.phoneNumber = fixedPhone.phoneNumber;
    });
  }
}
