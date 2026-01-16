import type { PhoneNumberRepository } from "../ports/PhoneNumberRepository";

export class InMemoryPhoneNumberRepository implements PhoneNumberRepository {
  #phoneNumbers: Map<number, string> = new Map();
  #nextId = 1;

  public async insertOrGetPhone(phone: string): Promise<number> {
    const id = this.#nextId++;
    this.#phoneNumbers.set(id, phone);
    return id;
  }

  // Helper method for testing
  public getPhoneById(id: number): string | undefined {
    return this.#phoneNumbers.get(id);
  }

  // Helper method for testing
  public clear(): void {
    this.#phoneNumbers.clear();
    this.#nextId = 1;
  }
}
