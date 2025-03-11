import type { RomeCode } from "shared";

export type OfferEntity = {
  appellationCode: string;
  appellationLabel: string;
  createdAt: Date;
  romeCode: RomeCode;
  romeLabel: string;
};
