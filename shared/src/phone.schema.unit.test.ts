import { isValidMobilePhone, phoneSchema } from "./phone.schema";

describe("phonesShema", () => {
  it.each<[string, string]>([
    ["0600000000", "+33600000000"], //FR
    ["0785689727", "+33785689727"], //FR
    ["0698000000", "+33698000000"], //FR
    ["0639000001", "+262639000001"], //YT
    ["0690000001", "+590690000001"], //GP
    ["0691282545", "+590691282545"], //GP
    ["0694000001", "+594694000001"], //GF
    ["0696000001", "+596696000001"], //MQ
    ["0692000001", "+262692000001"], //RE
    ["0693000001", "+262693000001"], //RE
    ["87123456", "+68987123456"], //PF
    ["751234", "+687751234"], //NC
    ["723456", "+681723456"], //WF
    ["551234", "+508551234"], //PM
  ])(
    "should be valid for mobile phone number %s %s",
    async (phone, expected) => {
      expect(phoneSchema.parse(phone)).toBe(expected);
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
  ])(
    "should get that it's a mobile number for mobile phone number %s",
    async (phone) => {
      expect(isValidMobilePhone(phone)).toBe(true);
    },
  );

  it.each<[string, string]>([
    ["01 00 00 00 00", "+33100000000"], //FR
    ["05 55 68 97 27", "+33555689727"], //FR
    ["0269 61 23 45", "+262269612345"], //YT
    ["0590 27 58 43", "+590590275843"], //GP
    ["0594 91 23 45", "+594594912345"], //GF
    ["0596 81 23 45", "+596596812345"], //MQ
    ["0262 61 23 45", "+262262612345"], //RE
    // ["40 12 34 56", "+68940123456"], //PF not valid according to libphonenumber-js
    ["24 56 78", "+687245678"], //NC
    ["72 34 56", "+681723456"], //WF
    ["41 23 56", "+508412356"], //PM
  ])("should be valid for fix phone number %s %s", async (phone, expected) => {
    expect(phoneSchema.parse(phone)).toBe(expected);
  });
});
