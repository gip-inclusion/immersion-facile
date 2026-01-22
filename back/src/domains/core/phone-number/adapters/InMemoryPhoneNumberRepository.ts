import type { PhoneNumberRepository } from "../ports/PhoneNumberRepository";

export class InMemoryPhoneNumberRepository implements PhoneNumberRepository {
  #phoneNumbers: Map<string, number> = new Map();
  #nextId = 1;

  public async getIdByPhoneNumber(phone: string, _now: Date): Promise<number> {
    const existingId = this.#phoneNumbers.get(phone);
    if (existingId) {
      return existingId;
    }
    const newId = this.#nextId++;
    this.#phoneNumbers.set(phone, newId);
    return newId;
  }
}
