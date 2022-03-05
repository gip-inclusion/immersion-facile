import {
  DataSource,
  EstablishmentEntityV2,
  TefenCode,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { NafDto } from "../shared/naf";
import { Builder } from "./Builder";

export const validEstablishmentEntityV2: EstablishmentEntityV2 = {
  siret: "78000403200019",
  name: "Company inside repository",
  address: "30 avenue des champs Elysées, 75017 Paris",
  dataSource: "form",
  voluntaryToImmersion: true,
  position: { lat: 35, lon: 50 },
  nafDto: { code: "8539A", nomenclature: "NAFRev2" },
  numberEmployeesRange: 11,
  updatedAt: new Date("2022-01-05T00:00:00.000"),
  isActive: true,
  isCommited: false,
  customizedName: "Custom name",
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
  withNafCode(code: string) {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      nafDto: { code, nomenclature: this.entity.nafDto.nomenclature },
    });
  }
  withNumberOfEmployeeRange(tefenCode: TefenCode) {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      numberEmployeesRange: tefenCode,
    });
  }
  notActive() {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      isActive: false,
    });
  }
  withUpdatedAt(updatedAt: Date) {
    return new EstablishmentEntityV2Builder({ ...this.entity, updatedAt });
  }
  build() {
    return this.entity;
  }
}
