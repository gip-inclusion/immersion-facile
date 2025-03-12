import { values } from "ramda";
import { type Email, isTruthy } from "shared";
import type { DelegationContactRepository } from "../ports/DelegationContactRepository";

type DelegationContactDto = {
  province: string;
  email: string;
};

export class InMemoryDelegationContactRepository
  implements DelegationContactRepository
{
  #delegationContacts: Record<string, DelegationContactDto> = {};

  public get delegationContacts(): DelegationContactDto[] {
    return values(this.#delegationContacts).filter(isTruthy);
  }

  public set delegationContacts(delegationContacts: DelegationContactDto[]) {
    this.#delegationContacts = delegationContacts.reduce(
      (acc, delegationContact) => ({
        ...acc,
        [delegationContact.province]: delegationContact,
      }),
      {},
    );
  }

  public getEmailByProvince(province: string): Promise<Email | undefined> {
    return Promise.resolve(this.#delegationContacts[province]?.email);
  }
}
