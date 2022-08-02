import { DepartmentCode, Postcode } from "shared/src/address/address.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";

export type AddressWithCoordinates = {
  label: string;
  streetNumberAndAddress: string;
  postcode: Postcode;
  departmentCode: DepartmentCode;
  city: string;
  coordinates: GeoPositionDto;
};

export interface ApiAddressGateway {
  lookupStreetAddress(query: string): Promise<AddressWithCoordinates[]>;
  findDepartmentCodeFromPostCode(query: string): Promise<DepartmentCode | null>;
}
