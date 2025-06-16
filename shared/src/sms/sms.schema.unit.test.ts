import { smsRecipientPhoneSchema } from "./sms.schema";

describe("sms phone number schema", () => {
  it("should accept international only mobile phone numbers", () => {
    const mobilePhoneNumber = "+596696000001"; // Martinique mobile phone number
    expect(smsRecipientPhoneSchema.parse(mobilePhoneNumber)).toBe(
      mobilePhoneNumber,
    );
  });

  it("wrong path", () => {
    const mobilePhoneNumber = "+596697000001"; // Martinique, not a mobile phone number
    expect(() => smsRecipientPhoneSchema.parse(mobilePhoneNumber)).toThrow();
  });
});
