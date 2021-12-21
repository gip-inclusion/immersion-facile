import { EstablishmentEntityV2 } from "../domain/immersionOffer/entities/EstablishmentAggregate";
import { ContactMethod } from "../shared/FormEstablishmentDto";
import { Builder } from "./Builder";

export const validEstablishmentEntityV2: EstablishmentEntityV2 = {
  siret: "78000403200019",
  name: "Company inside repository",
  address: "30 avenue des champs Elysées, 75017 Paris",
  voluntaryToImmersion: false,
  dataSource: "form",
  contactMethod: "EMAIL",
  position: { lat: 35, lon: 50 },
  naf: "8539A",
  numberEmployeesRange: 11,
};

export class EstablishmentEntityV2Builder
  implements Builder<EstablishmentEntityV2>
{
  constructor(
    private readonly entity: EstablishmentEntityV2 = validEstablishmentEntityV2,
  ) {}
  withAddress(address: string) {
    return new EstablishmentEntityV2Builder({ ...this.entity, address });
  }
  withContactMode(contactMethod: ContactMethod) {
    return new EstablishmentEntityV2Builder({ ...this.entity, contactMethod });
  }
  build() {
    return this.entity;
  }
}
