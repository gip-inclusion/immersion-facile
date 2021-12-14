import {
  AdresseAPI,
  Position,
} from "../../../domain/immersionOffer/ports/AdresseAPI";

export class InMemoryAdresseAPI implements AdresseAPI {
  constructor(private _position?: Position, private _cityCode?: number) {}

  public async getPositionFromAddress(
    _address: string,
  ): Promise<Position | undefined> {
    return this._position;
  }

  public async getCityCodeFromPosition(
    position: Position,
  ): Promise<number | undefined> {
    return this._cityCode;
  }

  // for test purposes only
  public setNextPosition(position: Position | undefined) {
    this._position = position;
  }

  public setNextCityCode(cityCode: number | undefined) {
    this._cityCode = cityCode;
  }
}
