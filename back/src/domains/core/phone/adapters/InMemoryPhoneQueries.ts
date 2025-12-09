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
}
