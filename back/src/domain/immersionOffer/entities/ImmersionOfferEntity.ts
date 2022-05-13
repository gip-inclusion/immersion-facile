import { ImmersionOfferId } from "shared/src/ImmersionOfferId";
import { RomeCode } from "shared/src/rome";

export type ImmersionOfferEntityV2 = {
  id: ImmersionOfferId;
  romeCode: RomeCode;
  score: number;
  appellationCode?: string; // TODO : make it mandatory
  createdAt: Date;
};

export type AnnotatedImmersionOfferEntityV2 = ImmersionOfferEntityV2 & {
  romeLabel: string;
  appellationLabel?: string;
};
