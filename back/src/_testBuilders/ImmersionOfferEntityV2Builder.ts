import { Builder, RomeCode } from "shared";

import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";

const validImmersionOfferEntityV2: ImmersionOfferEntityV2 = {
  romeCode: "B1805",
  score: 4.5,
  createdAt: new Date("2022-05-15T12:00:00.000"),
};

export class ImmersionOfferEntityV2Builder
  implements Builder<ImmersionOfferEntityV2>
{
  constructor(
    private readonly entity: ImmersionOfferEntityV2 = {
      ...validImmersionOfferEntityV2,
    },
  ) {}

  withRomeCode(romeCode: RomeCode) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      romeCode,
    });
  }

  withAppellationCode(appellationCode: string | undefined) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      appellationCode,
    });
  }
  withAppellationLabel(appellationLabel: string | undefined) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      appellationLabel,
    });
  }
  withCreatedAt(createdAt: Date) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      createdAt,
    });
  }

  build() {
    return this.entity;
  }
}
