import { LaBonneBoiteRequestEntity } from "../../../domain/immersionOffer/entities/LaBonneBoiteRequestEntity";
import { LaBonneBoiteRequestParams } from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { LaBonneBoiteRequestRepository } from "../../../domain/immersionOffer/ports/LaBonneBoiteRequestRepository";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";

export class InMemoryLaBonneBoiteRequestRepository
  implements LaBonneBoiteRequestRepository
{
  constructor(
    private _laBonneBoiteRequests: LaBonneBoiteRequestEntity[] = [],
  ) {}

  public async insertLaBonneBoiteRequest(
    laBonneBoiteRequest: LaBonneBoiteRequestEntity,
  ) {
    this._laBonneBoiteRequests.push(laBonneBoiteRequest);
  }
  public async getClosestRequestParamsWithThisRomeSince({
    since,
    rome: thisRome,
    position: thisPosition,
  }: {
    rome: string;
    position: { lat: number; lon: number };
    since: Date;
  }): Promise<{
    params: LaBonneBoiteRequestParams;
    distanceToPositionKm: number;
  } | null> {
    const requestsSinceWithThisRome = this._laBonneBoiteRequests.filter(
      (request) =>
        request.requestedAt >= since && request.params.rome === thisRome,
    );
    if (requestsSinceWithThisRome.length === 0) return null;

    return findGeographicalyClosestRequestParams(
      requestsSinceWithThisRome,
      thisPosition,
    );
  }

  // for test purposes only
  public set laBonneBoiteRequests(
    laBonneBoiteRequests: LaBonneBoiteRequestEntity[],
  ) {
    this._laBonneBoiteRequests = laBonneBoiteRequests;
  }

  public get laBonneBoiteRequests() {
    return this._laBonneBoiteRequests;
  }
}

const findGeographicalyClosestRequestParams = (
  requests: LaBonneBoiteRequestEntity[],
  toPotision: LatLonDto,
): { params: LaBonneBoiteRequestParams; distanceToPositionKm: number } =>
  requests
    .map((request) => ({
      params: request.params,
      distanceToPositionKm:
        distanceBetweenCoordinatesInMeters(
          request.params.lat,
          request.params.lon,
          toPotision.lat,
          toPotision.lon,
        ) / 1000,
    }))
    .reduce((previous, current) => previous.distanceToPositionKm < current.distanceToPositionKm
        ? previous
        : current);
