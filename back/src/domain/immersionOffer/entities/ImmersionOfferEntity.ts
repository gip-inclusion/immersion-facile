import { RomeCode } from "shared";

export type ImmersionOfferEntityV2 = {
  romeCode: RomeCode;
  score: number;
  appellationCode?: string; // TODO : make it mandatory
  appellationLabel?: string; // TODO : make it mandatory
  createdAt: Date;
};
