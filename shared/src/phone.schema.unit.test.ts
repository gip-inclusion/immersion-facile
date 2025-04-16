import { type CountryCode, parsePhoneNumber } from "libphonenumber-js";
import { isValidMobilePhone, phoneSchema } from "./phone.schema";

describe("phoneschema", () => {
  it.each<[string, CountryCode]>([
    ["0600000000", "FR"],
    ["0785689727", "FR"],
    ["0639000001", "YT"],
    ["0690000001", "GP"],
    ["0691282545", "GP"],
    ["0694000001", "GF"],
    ["0696000001", "MQ"],
    ["0692000001", "RE"],
    ["0693000001", "RE"],
    ["87123456", "PF"],
    ["751234", "NC"],
    ["723456", "WF"],
    ["551234", "PM"],
  ])(
    "should be valid for mobile phone number %s %s",
    async (phone, countryCode) => {
      expect(phoneSchema.parse(phone)).toBe(
        parsePhoneNumber(phone, countryCode).format("E.164"),
      );
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

  it.each<[string, CountryCode]>([
    ["01 00 00 00 00", "FR"],
    ["05 55 68 97 27", "FR"],
    ["0269 61 23 45", "YT"],
    ["0590 27 58 43", "GP"],
    ["0594 91 23 45", "GF"],
    ["0596 81 23 45", "MQ"],
    ["0262 61 23 45", "RE"],
    ["40 12 34 56", "PF"],
    ["24 56 78", "NC"],
    ["72 34 56", "WF"],
    ["41 23 56", "PM"],
  ])(
    "should be valid for fix phone number %s %s",
    async (phone, countryCode) => {
      expect(phoneSchema.parse(phone)).toBe(
        parsePhoneNumber(phone, countryCode).format("E.164"),
      );
    },
  );
});
