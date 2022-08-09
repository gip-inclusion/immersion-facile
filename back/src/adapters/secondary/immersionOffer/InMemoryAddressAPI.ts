import { AddressDto } from "shared/src/address/address.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import {
  AddressAPI,
  AddressAndPosition,
} from "../../../domain/immersionOffer/ports/AddressAPI";

export class InMemoryAddressAPI implements AddressAPI {
  constructor(
    private _position?: GeoPositionDto,
    private _cityCode?: number,
    private _address?: AddressDto,
  ) {}

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

  public async getCityCodeFromPosition(): Promise<number | undefined> {
    return this._cityCode;
  }

  // for test purposes only
  public setNextAddress(address: AddressDto | undefined) {
    this._address = address;
  }

  public setNextPosition(position: GeoPositionDto | undefined) {
    this._position = position;
  }

  public setNextCityCode(cityCode: number | undefined) {
    this._cityCode = cityCode;
  }
}
