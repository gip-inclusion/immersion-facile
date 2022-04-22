import { LatLonDto } from "../../../shared/latLon";
import { RomeCode } from "../../../shared/rome";

export type PassEmploiNotificationParams = {
  immersions: { siret: string; rome: RomeCode; location: LatLonDto }[];
};

export interface PassEmploiGateway {
  notifyOnNewImmersionOfferCreatedFromForm: (
    notificationParams: PassEmploiNotificationParams,
  ) => Promise<void>;
}
