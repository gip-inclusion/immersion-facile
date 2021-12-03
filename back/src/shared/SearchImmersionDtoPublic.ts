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
  contactId?: string;
  contactMode?: ContactMethodPublic;
  contactDetails?: ContactDetailsPublic; // only if authenticated with api key
};

// Funtion for typecheck only: to make sure our type matches the public type:
// prettier-ignore
const typecheck = (result: SearchImmersionResultDto): SearchImmersionResultPublic => result;
