import { LaBonneBoiteRequestEntity } from "../../../domain/immersionOffer/entities/LaBonneBoiteRequestEntity";
import { LaBonneBoiteRequestRepository } from "../../../domain/immersionOffer/ports/LaBonneBoiteRequestRepository";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { distanceMetersBetweenCoordinates } from "./distanceBetweenCoordinates";

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
  public async getClosestRequestWithThisRomeSince({
    rome: thisRome,
    position: thisPosition,
    since,
  }: {
    rome: string;
    position: LatLonDto;
    since: Date;
  }): Promise<null | LaBonneBoiteRequestEntity> {
    const requestsSinceWithThisRome = this._laBonneBoiteRequests.filter(
      (request) =>
        request.requestedAt >= since && request.params.rome === thisRome,
    );
    if (requestsSinceWithThisRome.length === 0) return null;

    const closestRequestWithThisRome = findGeographicalyClosestRequest(
      requestsSinceWithThisRome,
      thisPosition,
    );
    return closestRequestWithThisRome;
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

const findGeographicalyClosestRequest = (
  requests: LaBonneBoiteRequestEntity[],
  toPotision: LatLonDto,
): LaBonneBoiteRequestEntity =>
  requests.reduce((previous, current) => {
    return distanceMetersBetweenCoordinates(
      previous.params.lat,
      previous.params.lon,
      toPotision.lat,
      toPotision.lon,
    ) <
      distanceMetersBetweenCoordinates(
        current.params.lat,
        current.params.lon,
        toPotision.lat,
        toPotision.lon,
      )
      ? previous
      : current;
  });
