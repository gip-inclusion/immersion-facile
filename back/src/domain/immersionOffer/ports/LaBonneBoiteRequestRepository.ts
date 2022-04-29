import { LatLonDto } from "shared/src/latLon";
import { LaBonneBoiteRequestEntity } from "../entities/LaBonneBoiteRequestEntity";
import { LaBonneBoiteRequestParams } from "./LaBonneBoiteAPI";

export interface LaBonneBoiteRequestRepository {
  insertLaBonneBoiteRequest: (
    LaBonneBoiteRequest: LaBonneBoiteRequestEntity,
  ) => Promise<void>;

  getClosestRequestParamsWithThisRomeSince(props: {
    rome: string;
    position: LatLonDto;
    since: Date;
  }): Promise<{
    params: LaBonneBoiteRequestParams;
    distanceToPositionKm: number;
  } | null>;
}
