import { SearchResultDto } from "./SearchResult.dto";

export const getMapsLink = (searchResultData: SearchResultDto | undefined) => {
  if (!searchResultData) return;
  const { address, name } = searchResultData;
  const queryString = `${address.streetNumberAndAddress} ${address.postcode} ${address.city} ${name}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURI(
    queryString,
  )}`;
};
