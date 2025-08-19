import { getCountryCodeFromAddress } from "../address/address.dto";
import { localization, stringWithMaxLength255 } from "../zodUtils";

// Matches strings that contain at least one 5-digit number.
const postalCodeRegex = /(^|\s|,)\d{5}(\s|$|,)/;
export const addressWithPostalCodeSchema = stringWithMaxLength255.refine(
  (address) => {
    if (getCountryCodeFromAddress(address) === "FR") {
      return postalCodeRegex.test(address);
    }
    return true;
  },
  localization.invalidPostalCode,
);
