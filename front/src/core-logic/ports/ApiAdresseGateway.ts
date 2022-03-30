import { LatLonDto } from "src/shared/latLon";

export type AddressWithCoordinates = {
  label: string;
  coordinates: LatLonDto;
};

export interface ApiAdresseGateway {
  lookupStreetAddress(query: string): Promise<AddressWithCoordinates[]>;
  lookupPostCode(query: string): Promise<LatLonDto | null>;
}
