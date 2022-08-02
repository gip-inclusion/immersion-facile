import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { LaBonneBoiteRequestEntity } from "../entities/LaBonneBoiteRequestEntity";
import { LaBonneBoiteRequestParams } from "./LaBonneBoiteAPI";

export interface LaBonneBoiteRequestRepository {
  insertLaBonneBoiteRequest: (
    LaBonneBoiteRequest: LaBonneBoiteRequestEntity,
  ) => Promise<void>;

  getClosestRequestParamsWithThisRomeSince(props: {
    rome: string;
    position: GeoPositionDto;
    since: Date;
  }): Promise<{
    params: LaBonneBoiteRequestParams;
    distanceToPositionKm: number;
  } | null>;
}
