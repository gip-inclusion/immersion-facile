import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
  ImmersionOfferProps,
} from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { Builder } from "./Builder";

const validImmersionOfferProps: ImmersionOfferProps = {
  id: "13df03a5-a2a5-430a-b558-ed3e2f03512d",
  rome: "M1907",
  naf: "8539A",
  siret: "78000403200029",
  name: "Company inside repository",
  voluntaryToImmersion: false,
  data_source: "api_labonneboite",
  score: 4.5,
  position: { lat: 35, lon: 50 },
};

export class ImmersionOfferEntityBuilder
  implements Builder<ImmersionOfferEntity>
{
  public constructor(
    private props: ImmersionOfferProps = validImmersionOfferProps,
  ) {}

  public withId(id: string): ImmersionOfferEntityBuilder {
    return new ImmersionOfferEntityBuilder({ ...this.props, id });
  }
  public withSiret(siret: string): ImmersionOfferEntityBuilder {
    return new ImmersionOfferEntityBuilder({ ...this.props, siret });
  }

  public withContactInEstablishment(
    contactInEstablishment: ImmersionEstablishmentContact,
  ): ImmersionOfferEntityBuilder {
    return new ImmersionOfferEntityBuilder({
      ...this.props,
      contactInEstablishment,
    });
  }

  public clearContactInEstablishment(): ImmersionOfferEntityBuilder {
    return new ImmersionOfferEntityBuilder({
      ...this.props,
      contactInEstablishment: undefined,
    });
  }

  public build() {
    return new ImmersionOfferEntity(this.props);
  }
}
