import { ImmersionOfferId } from "../../../shared/ImmersionOfferId";

export type ImmersionOfferEntityV2 = {
  id: ImmersionOfferId;
  romeCode: string;
  score: number;
  appellationCode?: string; // TODO : make it mandatory
};

export type AnnotatedImmersionOfferEntityV2 = ImmersionOfferEntityV2 & {
  romeLabel: string;
  appellationLabel?: string;
};
