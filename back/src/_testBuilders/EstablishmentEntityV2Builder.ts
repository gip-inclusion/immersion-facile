import {
  DataSource,
  EstablishmentEntityV2,
  TefenCode,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { NafDto } from "../shared/naf";
import { Builder } from "./Builder";
import { FormEstablishmentSource } from "../shared/formEstablishment/FormEstablishment.dto";

export const validEstablishmentEntityV2: EstablishmentEntityV2 = {
  siret: "78000403200019",
  name: "Company inside repository",
  address: "30 avenue des champs Elysées, 75017 Paris",
  customizedName: undefined,
  isCommited: undefined,
  dataSource: "form",
  sourceProvider: undefined,
  voluntaryToImmersion: true,
  position: { lat: 35, lon: 50 },
  nafDto: { code: "8539A", nomenclature: "NAFRev2" },
  numberEmployeesRange: 11,
  updatedAt: new Date("2022-01-05T00:00:00.000"),
  isActive: true,
};

export class EstablishmentEntityV2Builder
  implements Builder<EstablishmentEntityV2>
{
  constructor(
    private readonly entity: EstablishmentEntityV2 = validEstablishmentEntityV2,
  ) {}

  withSiret(siret: string) {
    return new EstablishmentEntityV2Builder({ ...this.entity, siret });
  }

  withAddress(address: string) {
    return new EstablishmentEntityV2Builder({ ...this.entity, address });
  }

  withName(name: string) {
    return new EstablishmentEntityV2Builder({ ...this.entity, name });
  }

  withDataSource(dataSource: DataSource) {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      dataSource,
      voluntaryToImmersion: dataSource == "form",
    });
  }

  withNafDto(nafDto: NafDto) {
    return new EstablishmentEntityV2Builder({ ...this.entity, nafDto });
  }

  withNumberOfEmployeeRange(tefenCode: TefenCode) {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      numberEmployeesRange: tefenCode,
    });
  }

  withIsCommited(isCommited: boolean) {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      isCommited,
    });
  }

  notActive() {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      isActive: false,
    });
  }

  withSourceProvider(sourceProvider: FormEstablishmentSource) {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      sourceProvider,
    });
  }

  withUpdatedAt(updatedAt: Date) {
    return new EstablishmentEntityV2Builder({ ...this.entity, updatedAt });
  }
  build() {
    return this.entity;
  }
}
