import { Builder, RomeCode } from "shared";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";

export const defaultValidImmersionOfferEntityV2: ImmersionOfferEntityV2 = {
  romeCode: "B1805",
  appellationLabel: "Styliste",
  appellationCode: "19540",
  romeLabel: "Stylisme",
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

  public build() {
    return this.entity;
  }

  public withAppellationCode(appellationCode: string) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      appellationCode,
    });
  }

  public withAppellationLabel(appellationLabel: string) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      appellationLabel,
    });
  }

  public withCreatedAt(createdAt: Date) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      createdAt,
    });
  }

  public withRomeCode(romeCode: RomeCode) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      romeCode,
    });
  }

  public withRomeLabel(romeLabel: string) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      romeLabel,
    });
  }
}

export const secretariatImmersionOffer = new ImmersionOfferEntityV2Builder()
  .withRomeCode("M1607")
  .withAppellationLabel("Secrétaire")
  .withAppellationCode("19364")
  .withRomeLabel("Secrétariat")
  .build();

export const boulangerImmersionOffer = new ImmersionOfferEntityV2Builder()
  .withRomeCode("D1102")
  .withAppellationLabel("Boulanger / Boulangère")
  .withAppellationCode("11573")
  .withRomeLabel("Boulangerie - viennoiserie")
  .build();
export const boulangerAssistantImmersionOffer =
  new ImmersionOfferEntityV2Builder()
    .withRomeCode("D1102")
    .withAppellationLabel("Boulanger / Boulangère assistant de l'enfer!!!")
    .withAppellationCode("00666")
    .withRomeLabel("Boulangerie - viennoiserie")
    .build();
