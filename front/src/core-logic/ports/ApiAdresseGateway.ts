import { CountyCode, PostCode } from "shared/src/address/address.dto";
import { LatLonDto } from "shared/src/latLon";

export type AddressWithCoordinates = {
  label: string;
  streetNumberAndAddress: string;
  postCode: PostCode;
  countyCode: CountyCode;
  city: string;
  coordinates: LatLonDto;
};

export interface ApiAdresseGateway {
  lookupStreetAddress(query: string): Promise<AddressWithCoordinates[]>;
  findCountyCodeFromPostCode(query: string): Promise<CountyCode | null>;
}
