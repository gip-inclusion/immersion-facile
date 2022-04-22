import { ImmersionOfferId } from "../../../shared/ImmersionOfferId";
import { RomeCode } from "../../../shared/rome";

export type ImmersionOfferEntityV2 = {
  id: ImmersionOfferId;
  romeCode: RomeCode;
  score: number;
  appellationCode?: string; // TODO : make it mandatory
};

export type AnnotatedImmersionOfferEntityV2 = ImmersionOfferEntityV2 & {
  romeLabel: string;
  appellationLabel?: string;
};
