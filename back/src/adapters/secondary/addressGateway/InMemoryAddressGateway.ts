import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
} from "shared/src/address/address.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { AddressGateway } from "../../../domain/immersionOffer/ports/AddressGateway";

export class InMemoryAddressGateway implements AddressGateway {
  constructor(
    private _position?: GeoPositionDto,
    private _address?: AddressDto,
  ) {}

  public async lookupStreetAddress(
    _query: string,
  ): Promise<AddressAndPosition[]> {
    return this.streetAndAddresses;
  }

  public async findDepartmentCodeFromPostCode(
    _query: string,
  ): Promise<DepartmentCode | null> {
    return this.departmentCode;
  }

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    if (position.lat === 1111 && position.lon === 1111) throw new Error();
    return this._address;
  }

  public async getAddressAndPositionFromString(): Promise<
    AddressAndPosition | undefined
  > {
    if (!this._position || !this._address) return;
    return { position: this._position, address: this._address };
  }

  // for test purposes only
  public setNextAddress(address: AddressDto | undefined) {
    this._address = address;
  }

  public setNextPosition(position: GeoPositionDto | undefined) {
    this._position = position;
  }

  public setAddressAndPosition(streetAndAddresses: AddressAndPosition[]) {
    this.streetAndAddresses = streetAndAddresses;
  }
  public setDepartmentCode(departmentCode: DepartmentCode) {
    this.departmentCode = departmentCode;
  }

  private streetAndAddresses: AddressAndPosition[] = [];
  private departmentCode: DepartmentCode = "";
}
