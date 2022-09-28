import { GeoPositionDto } from "shared";
import { RomeCode } from "shared";

export type PassEmploiNotificationParams = {
  immersions: { siret: string; rome: RomeCode; location: GeoPositionDto }[];
};

export interface PassEmploiGateway {
  notifyOnNewImmersionOfferCreatedFromForm: (
    notificationParams: PassEmploiNotificationParams,
  ) => Promise<void>;
}
