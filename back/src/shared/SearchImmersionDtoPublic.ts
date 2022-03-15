// this file is the public api of the search
// Do NOT make backwards-incompatible changes without previous agreement with our parteners (passe emploi for now)

import type { SearchImmersionResultDto } from "./SearchImmersionDto";

type ContactMethodPublic = "UNKNOWN" | "EMAIL" | "PHONE" | "IN_PERSON";

type ContactDetailsPublic = {
  id: string;
  lastName: string;
  firstName: string;
  role: string;
  email?: string;
  phone?: string;
};

type SearchImmersionResultPublic = {
  id: string;
  rome: string;
  romeLabel: string;
  naf: string;
  nafLabel: string;
  siret: string;
  name: string;
  voluntaryToImmersion: boolean;
  location: { lat: number; lon: number };
  address: string;
  city: string;
  distance_m?: number;
  contactMode?: ContactMethodPublic;
  contactDetails?: ContactDetailsPublic; // only if authenticated with api key
};

// Function for type check only: to make sure our type matches the public type
// If a mapper is created between  SearchImmersionResultPublic (public external interface) and SearchImmersionResultDto (domain) this can be safely deleted
// prettier-ignore
const _isAssignable = (result: SearchImmersionResultDto): SearchImmersionResultPublic => result;
