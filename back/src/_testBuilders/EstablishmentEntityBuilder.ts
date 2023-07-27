import {
  AddressDto,
  Builder,
  defaultMaxContactsPerWeek,
  FormEstablishmentSource,
  GeoPositionDto,
  NafDto,
  NumberEmployeesRange,
} from "shared";
import { EstablishmentEntity } from "../domain/immersionOffer/entities/EstablishmentEntity";
import { avenueChampsElyseesDto } from "./addressDtos";

export const defaultNafCode = "7820Z";
const validEstablishmentEntityV2: EstablishmentEntity = {
  siret: "78000403200019",
  name: "Company inside repository",
  address: avenueChampsElyseesDto,
  website: "www.jobs.fr",
  additionalInformation: "",
  customizedName: undefined,
  isCommited: undefined,
  sourceProvider: "immersion-facile",
  voluntaryToImmersion: true,
  position: {
    lat: 48.866667, // Paris lat/lon
    lon: 2.333333,
  },
  nafDto: { code: defaultNafCode, nomenclature: "NAFRev2" },
  numberEmployeesRange: "10-19",
  updatedAt: new Date("2022-01-05T12:00:00.000"),
  isOpen: true,
  isSearchable: true,
  maxContactsPerWeek: defaultMaxContactsPerWeek,
};

export class EstablishmentEntityBuilder
  implements Builder<EstablishmentEntity>
{
  constructor(
    private readonly entity: EstablishmentEntity = validEstablishmentEntityV2,
  ) {}

  build() {
    return this.entity;
  }

  withAdditionalInformation(additionalInformation: string) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      additionalInformation,
    });
  }

  withAddress(address: AddressDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, address });
  }

  withCustomizedName(customizedName: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, customizedName });
  }

  withFitForDisabledWorkers(fitForDisabledWorkers: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      fitForDisabledWorkers,
    });
  }

  withIsCommited(isCommited: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isCommited,
    });
  }

  withIsOpen(isOpen: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isOpen,
    });
  }

  withIsSearchable(isSearchable: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isSearchable,
    });
  }

  withLastInseeCheck(lastInseeCheck: Date | undefined) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      lastInseeCheckDate: lastInseeCheck,
    });
  }

  withMaxContactsPerWeek(maxContactsPerWeek: number) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      maxContactsPerWeek,
    });
  }

  withNafDto(nafDto: NafDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, nafDto });
  }

  withName(name: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, name });
  }

  withNumberOfEmployeeRange(numberEmployeesRange: NumberEmployeesRange) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      numberEmployeesRange,
    });
  }

  withPosition(position: GeoPositionDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, position });
  }

  withSiret(siret: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, siret });
  }

  withSourceProvider(sourceProvider: FormEstablishmentSource) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      sourceProvider,
    });
  }

  withUpdatedAt(updatedAt: Date) {
    return new EstablishmentEntityBuilder({ ...this.entity, updatedAt });
  }

  withWebsite(website: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, website });
  }
}
