import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { LaBonneBoiteRequestEntity } from "../entities/LaBonneBoiteRequestEntity";

export interface LaBonneBoiteRequestRepository {
  insertLaBonneBoiteRequest: (
    LaBonneBoiteRequest: LaBonneBoiteRequestEntity,
  ) => Promise<void>;

  getClosestRequestWithThisRomeSince(props: {
    rome: string;
    position: LatLonDto;
    since: Date;
  }): Promise<LaBonneBoiteRequestEntity | null>;
}
