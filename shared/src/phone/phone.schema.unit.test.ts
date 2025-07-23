import { isValidMobilePhone, phoneNumberSchema } from "./phone.schema";

describe("phonesShema", () => {
  it.each<string>([
    "+33100000000", //FR
    "+33555689727", //FR
    "+262269612345", //YT
    "+590590275843", //GP
    "+594594912345", //GF
    "+596596812345", //MQ
    "+262262612345", //RE
    "+68940123456", //PF seems to be invalid for libphonenumber-js/max
    "+687245678", //NC
    "+681723456", //WF
    "+508412356", //PM
    "+37257702405", // ESTONIA
    "+49254879865", // GERMANY
    "+34912345678", // ES
    "+4532123456", // DK
    "+35312345678", // IR
  ])(
    "should be valid for fix phone number (FR and other countries) %s",
    async (phone) => {
      expect(phoneNumberSchema.parse(phone)).toBe(phone);
    },
  );

  it.each<string>([
    "+33600000000", //FR
    "+33785689727", //FR
    "+262639000001", //YT
    "+590690000001", //GP
    "+590691282545", //GP
    "+594694000001", //GF
    "+596696000001", //MQ
    "+262692000001", //RE
    "+262693000001", //RE
    "+68987123456", //PF
    "+687751234", //NC
    "+681723456", //WF
    "+508551234", //PM
    "+491701234567", // DE
    "+34612345678", // ES
    "+4521123456", // DK
    "+351912345678", // IR
  ])(
    "should be valid for mobile phone number (FR and other countries) %s",
    async (phone) => {
      expect(phoneNumberSchema.parse(phone)).toBe(phone);
    },
  );

  it.each<string>([
    "+33600000000",
    "+33785689727",
    "+262639000001",
    "+590690000001",
    "+590691282545",
    "+594694000001",
    "+596696000001",
    "+262692000001",
    "+262693000001",
    "+68987770076",
    "+687751234",
    "+681821234",
    "+508551234",
    "+491701234567", // DE
    "+34612345678", // ES
    "+4521123456", // DK
    "+351912345678", // IR
  ])(
    "should be a valid mobile phone number (FR and other countries) %s",
    async (phone) => {
      expect(isValidMobilePhone(phone)).toBe(true);
    },
  );
});
