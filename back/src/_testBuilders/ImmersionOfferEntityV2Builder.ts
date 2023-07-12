import { Builder, RomeCode } from "shared";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";

export const defaultValidImmersionOfferEntityV2: ImmersionOfferEntityV2 = {
  romeCode: "B1805",
  appellationLabel: "Styliste",
  appellationCode: "19540",
  score: 4.5,
  createdAt: new Date("2022-05-15T12:00:00.000"),
};

export class ImmersionOfferEntityV2Builder
  implements Builder<ImmersionOfferEntityV2>
{
  constructor(
    private readonly entity: ImmersionOfferEntityV2 = {
      ...defaultValidImmersionOfferEntityV2,
    },
  ) {}

  withRomeCode(romeCode: RomeCode) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      romeCode,
    });
  }

  withAppellationCode(appellationCode: string) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      appellationCode,
    });
  }
  withAppellationLabel(appellationLabel: string) {
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

export const secretariatImmersionOffer = new ImmersionOfferEntityV2Builder()
  .withRomeCode("M1607")
  .withAppellationLabel("Secrétaire")
  .withAppellationCode("19364")
  .build();

export const boulangerImmersionOffer = new ImmersionOfferEntityV2Builder()
  .withRomeCode("D1102")
  .withAppellationLabel("Boulanger / Boulangère")
  .withAppellationCode("11573")
  .build();
export const boulangerAssistantImmersionOffer =
  new ImmersionOfferEntityV2Builder()
    .withRomeCode("D1102")
    .withAppellationLabel("Boulanger / Boulangère assistant de l'enfer!!!")
    .withAppellationCode("00666")
    .build();
