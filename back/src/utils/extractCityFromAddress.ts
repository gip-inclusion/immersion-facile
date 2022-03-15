// For addresses containing a post code, this function will consider anything
// that appears after the last 5-digit number to be the city.
//
// Examples:
//   - 1 AV DU DOCTEUR GLEY 75020 PARIS 20 -> PARIS 20
//   - 1 AV DU DOCTEUR GLEY                -> (empty string)
export const extractCityFromAddress = (address: string) => {
  const match: RegExpMatchArray | null = address.match(/^.*\d{5}\s(.*)$/);
  return match ? match[1] : "";
};
