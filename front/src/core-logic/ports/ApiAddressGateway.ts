import { DepartmentCode, Postcode } from "shared/src/address/address.dto";
import { LatLonDto } from "shared/src/latLon";

export type AddressWithCoordinates = {
  label: string;
  streetNumberAndAddress: string;
  postcode: Postcode;
  departmentCode: DepartmentCode;
  city: string;
  coordinates: LatLonDto;
};

export interface ApiAddressGateway {
  lookupStreetAddress(query: string): Promise<AddressWithCoordinates[]>;
  findDepartmentCodeFromPostCode(query: string): Promise<DepartmentCode | null>;
}
