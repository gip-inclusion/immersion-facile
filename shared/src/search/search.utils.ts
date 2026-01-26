import type { OfferDto } from "./Offer.dto";

export const getMapsLink = (searchResultData: OfferDto | undefined) => {
  if (!searchResultData) return;
  const { address, name } = searchResultData;
  const queryString = `${address.streetNumberAndAddress} ${address.postcode} ${address.city} ${name}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURI(
    queryString,
  )}`;
};
