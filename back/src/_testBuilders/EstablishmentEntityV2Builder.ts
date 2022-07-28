import { AddressDto } from "shared/src/address/address.dto";
import { Builder } from "shared/src/Builder";
import { FormEstablishmentSource } from "shared/src/formEstablishment/FormEstablishment.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { NafDto } from "shared/src/naf";
import {
  DataSource,
  EstablishmentEntityV2,
  NumberEmployeesRange,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { avenueChampsElyseesDto } from "./addressDtos";

export const validEstablishmentEntityV2: EstablishmentEntityV2 = {
  siret: "78000403200019",
  name: "Company inside repository",
  address: avenueChampsElyseesDto,
  website: "www.jobs.fr",
  additionalInformation: "",
  customizedName: undefined,
  isCommited: undefined,
  dataSource: "form",
  sourceProvider: "immersion-facile",
  voluntaryToImmersion: true,
  position: { lat: 35, lon: 50 },
  nafDto: { code: "8539A", nomenclature: "NAFRev2" },
  numberEmployeesRange: "10-19",
  updatedAt: new Date("2022-01-05T12:00:00.000"),
  isActive: true,
  isSearchable: true,
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

  withAddress(address: AddressDto) {
    return new EstablishmentEntityV2Builder({ ...this.entity, address });
  }
  withWebsite(website: string) {
    return new EstablishmentEntityV2Builder({ ...this.entity, website });
  }
  withPosition(position: GeoPositionDto) {
    return new EstablishmentEntityV2Builder({ ...this.entity, position });
  }
  withName(name: string) {
    return new EstablishmentEntityV2Builder({ ...this.entity, name });
  }
  withCustomizedName(customizedName: string) {
    return new EstablishmentEntityV2Builder({ ...this.entity, customizedName });
  }
  withDataSource(dataSource: DataSource) {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      dataSource,
      voluntaryToImmersion: dataSource === "form",
    });
  }

  withNafDto(nafDto: NafDto) {
    return new EstablishmentEntityV2Builder({ ...this.entity, nafDto });
  }

  withNumberOfEmployeeRange(numberEmployeesRange: NumberEmployeesRange) {
    return new EstablishmentEntityV2Builder({
      ...this.entity,
      numberEmployeesRange,
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
