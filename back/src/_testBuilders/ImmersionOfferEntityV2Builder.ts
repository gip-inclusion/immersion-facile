import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { ImmersionOfferId } from "shared/src/ImmersionOfferId";
import { RomeCode } from "shared/src/rome";
import { Builder } from "shared/src/Builder";

const validImmersionOfferEntityV2: ImmersionOfferEntityV2 = {
  id: "13df03a5-a2a5-430a-b558-ed3e2f03512d",
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
      id: new UuidV4Generator().new(),
    },
  ) {}

  withId(id: ImmersionOfferId) {
    return new ImmersionOfferEntityV2Builder({ ...this.entity, id });
  }
  withNewId() {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      id: new UuidV4Generator().new(),
    });
  }
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
