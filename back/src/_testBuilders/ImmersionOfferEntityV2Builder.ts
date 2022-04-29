import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { ImmersionOfferId } from "shared/src/ImmersionOfferId";
import { RomeCode } from "shared/src/rome";
import { Builder } from "./Builder";

const validImmersionOfferEntityV2: ImmersionOfferEntityV2 = {
  id: "13df03a5-a2a5-430a-b558-ed3e2f03512d",
  romeCode: "B1805",
  score: 4.5,
};

export class ImmersionOfferEntityV2Builder
  implements Builder<ImmersionOfferEntityV2>
{
  constructor(
    private readonly entity: ImmersionOfferEntityV2 = validImmersionOfferEntityV2,
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

  withAppellationCode(appellationCode: string) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      appellationCode,
    });
  }

  build() {
    return this.entity;
  }
}
