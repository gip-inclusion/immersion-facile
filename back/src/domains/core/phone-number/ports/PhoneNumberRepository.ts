export interface PhoneNumberRepository {
  getIdByPhoneNumber(phone: string, now: Date): Promise<number>;
}
