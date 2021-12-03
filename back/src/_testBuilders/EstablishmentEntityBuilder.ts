import {
  EstablishmentEntity,
  EstablishmentProps,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ContactMethod } from "../shared/FormEstablishmentDto";
import { Builder } from "./Builder";

const validEstablishment: EstablishmentProps = {
  numberEmployeesRange: 11,
  position: { lat: 43, lon: 2 },
  naf: "8539A",
  id: "11111111-3270-11ec-8d3d-00000c130003",
  siret: "78000403200019",
  name: "Ma boulangerie",
  address: "30 avenue des champs Elysées, 75017 Paris",
  score: 10,
  romes: ["M1907", "D1102"],
  voluntaryToImmersion: true,
  dataSource: "form",
  contactMode: "EMAIL",
};

export class EstablishmentEntityBuilder
  implements Builder<EstablishmentEntity>
{
  constructor(
    private entity: EstablishmentEntity = new EstablishmentEntity(
      validEstablishment,
    ),
  ) {}

  withSiret(siret: string) {
    return new EstablishmentEntityBuilder(
      new EstablishmentEntity({ ...this.entity.getProps(), siret }),
    );
  }

  withContactMode(contactMode: ContactMethod) {
    return new EstablishmentEntityBuilder(
      new EstablishmentEntity({ ...this.entity.getProps(), contactMode }),
    );
  }

  withAddress(address: string) {
    return new EstablishmentEntityBuilder(
      new EstablishmentEntity({ ...this.entity.getProps(), address }),
    );
  }

  build() {
    return this.entity;
  }
}
