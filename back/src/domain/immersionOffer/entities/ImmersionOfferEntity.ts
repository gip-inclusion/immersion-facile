import { RomeCode } from "shared";

export type ImmersionOfferEntityV2 = {
  romeCode: RomeCode;
  score: number;
  appellationCode?: string; // TODO : make it mandatory
  createdAt: Date;
};

export type AnnotatedImmersionOfferEntityV2 = ImmersionOfferEntityV2 & {
  romeLabel: string;
  appellationLabel?: string;
};
