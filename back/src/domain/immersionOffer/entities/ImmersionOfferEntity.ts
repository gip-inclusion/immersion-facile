import { RomeCode } from "shared";

export type ImmersionOfferEntityV2 = {
  romeCode: RomeCode;
  score: number;
  appellationCode: string;
  appellationLabel: string;
  romeLabel: string;
  createdAt: Date;
};
