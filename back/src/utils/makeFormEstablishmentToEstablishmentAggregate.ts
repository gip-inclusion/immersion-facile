import {
  AddressDto,
  AppellationDto,
  FormEstablishmentDto,
  GeoPositionDto,
  NafDto,
  noContactPerWeek,
  NumberEmployeesRange,
  SiretDto,
} from "shared";
import { TimeGateway } from "../domain/core/ports/TimeGateway";
import { UuidGenerator } from "../domain/core/ports/UuidGenerator";
import { ContactEntity } from "../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { AddressGateway } from "../domain/immersionOffer/ports/AddressGateway";
import { SirenGateway } from "../domain/sirene/ports/SirenGateway";
import { getSirenEstablishmentFromApi } from "../domain/sirene/service/getSirenEstablishmentFromApi";

const offerFromFormScore = 10;

const appelationToImmersionOfferEntity =
  (timeGateway: TimeGateway) =>
  ({ romeCode, appellationCode }: AppellationDto): ImmersionOfferEntityV2 => ({
    romeCode,
    appellationCode,
    score: offerFromFormScore,
    createdAt: timeGateway.now(),
  });

export const makeFormEstablishmentToEstablishmentAggregate = ({
  uuidGenerator,
  timeGateway,
  addressGateway,
  sirenGateway,
}: {
  uuidGenerator: UuidGenerator;
  timeGateway: TimeGateway;
  addressGateway: AddressGateway;
  sirenGateway: SirenGateway;
}) => {
  const createEstablishmentAggregate = makeCreateEstablishmentAggregate({
    uuidGenerator,
    timeGateway,
  });

  return async (
    formEstablishment: FormEstablishmentDto,
  ): Promise<EstablishmentAggregate | undefined> => {
    const addressAndPosition = await getAddressAndPosition(
      addressGateway,
      formEstablishment,
    );

    const nafAndNumberOfEmployee = await getNafAndNumberOfEmployee(
      sirenGateway,
      formEstablishment.siret,
    );

    return createEstablishmentAggregate({
      nafAndNumberOfEmployee,
      addressAndPosition,
      formEstablishment,
    });
  };
};

export const makeUpdateEstablishmentAggregateFromFormEstablishment = ({
  uuidGenerator,
  timeGateway,
  addressGateway,
}: {
  uuidGenerator: UuidGenerator;
  timeGateway: TimeGateway;
  addressGateway: AddressGateway;
}) => {
  const createEstablishmentAggregate = makeCreateEstablishmentAggregate({
    uuidGenerator,
    timeGateway,
  });

  return async (
    initialAggregate: EstablishmentAggregate,
    formEstablishment: FormEstablishmentDto,
  ): Promise<EstablishmentAggregate | undefined> => {
    const addressAndPosition = await getAddressAndPosition(
      addressGateway,
      formEstablishment,
    );

    const nafAndNumberOfEmployee: NafAndNumberOfEmpolyee = {
      nafDto: initialAggregate.establishment.nafDto,
      numberEmployeesRange: initialAggregate.establishment.numberEmployeesRange,
    };

    return createEstablishmentAggregate({
      nafAndNumberOfEmployee,
      addressAndPosition,
      formEstablishment,
    });
  };
};

type AddressAndPosition = { address: AddressDto; position: GeoPositionDto };

const getAddressAndPosition = async (
  addressGateway: AddressGateway,
  formEstablishment: FormEstablishmentDto,
): Promise<AddressAndPosition> => {
  const positionAndAddress = (
    await addressGateway.lookupStreetAddress(formEstablishment.businessAddress)
  ).at(0);

  if (!positionAndAddress)
    throw new Error(
      `Cannot find the address ${formEstablishment.businessAddress} in API for establishment with siret ${formEstablishment.siret}`,
    );

  const { address, position } = positionAndAddress;
  return { address, position };
};

type NafAndNumberOfEmpolyee = {
  nafDto: NafDto;
  numberEmployeesRange: NumberEmployeesRange;
};

const getNafAndNumberOfEmployee = async (
  sirenGateway: SirenGateway,
  siret: SiretDto,
): Promise<NafAndNumberOfEmpolyee> => {
  const { nafDto, numberEmployeesRange } = await getSirenEstablishmentFromApi(
    { siret },
    sirenGateway,
  );

  if (!nafDto || numberEmployeesRange === undefined)
    throw new Error(
      `Some field from siren gateway are missing for establishment with siret ${siret} : nafDto=${nafDto}; numberEmployeesRange=${numberEmployeesRange}`,
    );

  return {
    nafDto,
    numberEmployeesRange,
  };
};

const makeCreateEstablishmentAggregate =
  ({
    uuidGenerator,
    timeGateway,
  }: {
    uuidGenerator: UuidGenerator;
    timeGateway: TimeGateway;
  }) =>
  ({
    formEstablishment,
    nafAndNumberOfEmployee: { nafDto, numberEmployeesRange },
    addressAndPosition: { address, position },
  }: {
    formEstablishment: FormEstablishmentDto;
    addressAndPosition: AddressAndPosition;
    nafAndNumberOfEmployee: NafAndNumberOfEmpolyee;
  }) => {
    const contact: ContactEntity = {
      id: uuidGenerator.new(),
      ...formEstablishment.businessContact,
    };

    const immersionOffers: ImmersionOfferEntityV2[] =
      formEstablishment.appellations.map(
        appelationToImmersionOfferEntity(timeGateway),
      );

    const establishment: EstablishmentEntity = {
      siret: formEstablishment.siret,
      name: formEstablishment.businessName,
      customizedName: formEstablishment.businessNameCustomized,
      website: formEstablishment.website,
      additionalInformation: formEstablishment.additionalInformation,
      isCommited: formEstablishment.isEngagedEnterprise,
      address,
      voluntaryToImmersion: true,
      dataSource: "form",
      sourceProvider: formEstablishment.source,
      nafDto,
      position,
      numberEmployeesRange,
      isActive: true,
      updatedAt: timeGateway.now(),
      fitForDisabledWorkers: formEstablishment.fitForDisabledWorkers,
      isSearchable: formEstablishment.maxContactsPerWeek > noContactPerWeek,
      maxContactsPerWeek: formEstablishment.maxContactsPerWeek,
    };

    const establishmentAggregate: EstablishmentAggregate = {
      establishment,
      contact,
      immersionOffers,
    };

    return establishmentAggregate;
  };
