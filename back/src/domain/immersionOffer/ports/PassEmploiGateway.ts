import { LatLonDto } from "shared/src/latLon";
import { RomeCode } from "shared/src/rome";

export type PassEmploiNotificationParams = {
  immersions: { siret: string; rome: RomeCode; location: LatLonDto }[];
};

export interface PassEmploiGateway {
  notifyOnNewImmersionOfferCreatedFromForm: (
    notificationParams: PassEmploiNotificationParams,
  ) => Promise<void>;
}
