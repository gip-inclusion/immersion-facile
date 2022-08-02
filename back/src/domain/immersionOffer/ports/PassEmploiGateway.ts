import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { RomeCode } from "shared/src/rome";

export type PassEmploiNotificationParams = {
  immersions: { siret: string; rome: RomeCode; location: GeoPositionDto }[];
};

export interface PassEmploiGateway {
  notifyOnNewImmersionOfferCreatedFromForm: (
    notificationParams: PassEmploiNotificationParams,
  ) => Promise<void>;
}
