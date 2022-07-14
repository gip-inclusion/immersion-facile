import { LatLonDto } from "shared/src/latLon";
import { AdresseAPI } from "../../../domain/immersionOffer/ports/AdresseAPI";

export class InMemoryAdresseAPI implements AdresseAPI {
  constructor(private _position?: LatLonDto, private _cityCode?: number) {}

  public async getPositionFromAddress(): Promise<LatLonDto | undefined> {
    return this._position;
  }

  public async getCityCodeFromPosition(): Promise<number | undefined> {
    return this._cityCode;
  }

  // for test purposes only
  public setNextPosition(position: LatLonDto | undefined) {
    this._position = position;
  }

  // eslint-disable-next-line
  public setNextCityCode(cityCode: number | undefined) {
    this._cityCode = cityCode;
  }
}
