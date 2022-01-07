import { AdresseAPI } from "../../../domain/immersionOffer/ports/AdresseAPI";
import { LatLonDto } from "../../../shared/SearchImmersionDto";

export class InMemoryAdresseAPI implements AdresseAPI {
  constructor(private _position?: LatLonDto, private _cityCode?: number) {}

  public async getPositionFromAddress(
    _address: string,
  ): Promise<LatLonDto | undefined> {
    return this._position;
  }

  public async getCityCodeFromPosition(
    position: LatLonDto,
  ): Promise<number | undefined> {
    return this._cityCode;
  }

  // for test purposes only
  public setNextPosition(position: LatLonDto | undefined) {
    this._position = position;
  }

  public setNextCityCode(cityCode: number | undefined) {
    this._cityCode = cityCode;
  }
}
