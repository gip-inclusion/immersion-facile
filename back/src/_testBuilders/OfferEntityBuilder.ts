import { Builder, RomeCode } from "shared";
import { OfferEntity } from "../domain/offer/entities/OfferEntity";

export const defaultValidOfferEntity: OfferEntity = {
  romeCode: "B1805",
  appellationLabel: "Styliste",
  appellationCode: "19540",
  romeLabel: "Stylisme",
  score: 4.5,
  createdAt: new Date("2022-05-15T12:00:00.000"),
};

export class OfferEntityBuilder implements Builder<OfferEntity> {
  constructor(
    private readonly entity: OfferEntity = {
      ...defaultValidOfferEntity,
    },
  ) {}

  public build() {
    return this.entity;
  }

  public withAppellationCode(appellationCode: string) {
    return new OfferEntityBuilder({
      ...this.entity,
      appellationCode,
    });
  }

  public withAppellationLabel(appellationLabel: string) {
    return new OfferEntityBuilder({
      ...this.entity,
      appellationLabel,
    });
  }

  public withCreatedAt(createdAt: Date) {
    return new OfferEntityBuilder({
      ...this.entity,
      createdAt,
    });
  }

  public withRomeCode(romeCode: RomeCode) {
    return new OfferEntityBuilder({
      ...this.entity,
      romeCode,
    });
  }

  public withRomeLabel(romeLabel: string) {
    return new OfferEntityBuilder({
      ...this.entity,
      romeLabel,
    });
  }
}

export const secretariatOffer = new OfferEntityBuilder()
  .withRomeCode("M1607")
  .withAppellationLabel("Secrétaire")
  .withAppellationCode("19364")
  .withRomeLabel("Secrétariat")
  .build();

export const boulangerOffer = new OfferEntityBuilder()
  .withRomeCode("D1102")
  .withAppellationLabel("Boulanger / Boulangère")
  .withAppellationCode("11573")
  .withRomeLabel("Boulangerie - viennoiserie")
  .build();

export const boulangerAssistantOffer = new OfferEntityBuilder()
  .withRomeCode("D1102")
  .withAppellationLabel("Boulanger / Boulangère assistant de l'enfer!!!")
  .withAppellationCode("00666")
  .withRomeLabel("Boulangerie - viennoiserie")
  .build();
