import { ImmersionOfferId } from "../../../shared/SearchImmersionDto";

export type ImmersionOfferEntityV2 = {
  id: ImmersionOfferId;
  rome: string;
  score: number;
};

export type AnnotatedImmersionOfferEntityV2 = ImmersionOfferEntityV2 & {
  romeLabel: string;
};
