import { Email } from "shared";

export interface DelegationContactRepository {
  getEmailByProvince(province: string): Promise<Email | undefined>;
}
