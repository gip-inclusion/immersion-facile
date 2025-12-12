import type { RemoteWorkMode, RomeCode } from "shared";

export type OfferEntity = {
  appellationCode: string;
  appellationLabel: string;
  remoteWorkMode: RemoteWorkMode;
  createdAt: Date;
  romeCode: RomeCode;
  romeLabel: string;
};
