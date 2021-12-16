import { EstablishmentEntityV2 } from "../domain/immersionOffer/entities/EstablishmentAggregate";
import { Builder } from "./Builder";

export const validEstablishmentEntityV2: EstablishmentEntityV2 = {
  siret: "78000403200019",
  name: "Ma boulangerie",
  address: "30 avenue des champs Elysées, 75017 Paris",
  voluntaryToImmersion: true,
  dataSource: "form",
  contactMethod: "EMAIL",
  position: { lat: 43, lon: 2 },
  naf: "8539A",
  numberEmployeesRange: 11,
};

export class EstablishmentEntityV2Builder
  implements Builder<EstablishmentEntityV2>
{
  constructor(
    private readonly entity: EstablishmentEntityV2 = validEstablishmentEntityV2,
  ) {}

  build() {
    return this.entity;
  }
}
