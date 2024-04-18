export interface DelegationContactRepository {
  getEmailByProvince(province: string): Promise<string | undefined>;
}
