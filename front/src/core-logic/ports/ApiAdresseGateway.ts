import { CountyCode } from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

export type AddressWithCoordinates = {
  label: string;
  coordinates: LatLonDto;
};

export interface ApiAdresseGateway {
  lookupStreetAddress(query: string): Promise<AddressWithCoordinates[]>;
  lookupPostCode(query: string): Promise<CountyCode | null>;
}
