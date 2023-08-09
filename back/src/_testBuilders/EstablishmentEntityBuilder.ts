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
  createdAt: new Date(),
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

  public build() {
    return this.entity;
  }

  public withAdditionalInformation(additionalInformation: string) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      additionalInformation,
    });
  }

  public withAddress(address: AddressDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, address });
  }

  public withCustomizedName(customizedName: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, customizedName });
  }

  public withFitForDisabledWorkers(fitForDisabledWorkers: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      fitForDisabledWorkers,
    });
  }

  public withIsCommited(isCommited: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isCommited,
    });
  }

  public withIsOpen(isOpen: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isOpen,
    });
  }

  public withIsSearchable(isSearchable: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isSearchable,
    });
  }

  public withLastInseeCheck(lastInseeCheck: Date | undefined) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      lastInseeCheckDate: lastInseeCheck,
    });
  }

  public withMaxContactsPerWeek(maxContactsPerWeek: number) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      maxContactsPerWeek,
    });
  }

  public withNafDto(nafDto: NafDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, nafDto });
  }

  public withName(name: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, name });
  }

  public withNumberOfEmployeeRange(numberEmployeesRange: NumberEmployeesRange) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      numberEmployeesRange,
    });
  }

  public withPosition(position: GeoPositionDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, position });
  }

  public withSiret(siret: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, siret });
  }

  public withSourceProvider(sourceProvider: FormEstablishmentSource) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      sourceProvider,
    });
  }

  public withUpdatedAt(updatedAt: Date) {
    return new EstablishmentEntityBuilder({ ...this.entity, updatedAt });
  }

  public withWebsite(website: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, website });
  }
}
