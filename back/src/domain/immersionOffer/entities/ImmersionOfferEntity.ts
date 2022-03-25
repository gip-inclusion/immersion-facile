import { Flavor } from "../../../shared/typeFlavors";

export type ImmersionOfferId = Flavor<string, "ImmersionOfferId">;

export type ImmersionOfferEntityV2 = {
  id: ImmersionOfferId;
  romeCode: string;
  score: number;
  romeAppellation?: number; // TODO : make it mandatory
};

export type AnnotatedImmersionOfferEntityV2 = ImmersionOfferEntityV2 & {
  romeLabel: string;
  appellationLabel?: string;
};
