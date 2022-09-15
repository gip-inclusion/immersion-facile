import { AddressDto } from "shared/src/address/address.dto";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { NafDto } from "shared/src/naf";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { Clock } from "../domain/core/ports/Clock";
import { UuidGenerator } from "../domain/core/ports/UuidGenerator";
import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
  NumberEmployeesRange,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { AddressGateway } from "../domain/immersionOffer/ports/AddressGateway";
import { SireneGateway } from "../domain/sirene/ports/SireneGateway";
import { SireneEstablishmentVO } from "../domain/sirene/valueObjects/SireneEstablishmentVO";

const offerFromFormScore = 10;

const appelationToImmersionOfferEntity =
  (clock: Clock) =>
  ({ romeCode, appellationCode }: AppellationDto): ImmersionOfferEntityV2 => ({
    romeCode,
    appellationCode,
    score: offerFromFormScore,
    createdAt: clock.now(),
  });

export const makeFormEstablishmentToEstablishmentAggregate = ({
  uuidGenerator,
  clock,
  addressGateway,
  sireneGateway,
}: {
  uuidGenerator: UuidGenerator;
  clock: Clock;
  addressGateway: AddressGateway;
  sireneGateway: SireneGateway;
}) => {
  const createEstablishmentAggregate = makeCreateEstablishmentAggregate({
    uuidGenerator,
    clock,
  });

  return async (
    formEstablishment: FormEstablishmentDto,
  ): Promise<EstablishmentAggregate | undefined> => {
    const addressAndPosition = await getAddressAndPosition(
      addressGateway,
      formEstablishment,
    );

    const nafAndNumberOfEmployee = await getNafAndNumberOfEmployee(
      sireneGateway,
      formEstablishment,
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
  clock,
  addressGateway,
}: {
  uuidGenerator: UuidGenerator;
  clock: Clock;
  addressGateway: AddressGateway;
}) => {
  const createEstablishmentAggregate = makeCreateEstablishmentAggregate({
    uuidGenerator,
    clock,
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
  sireneGateway: SireneGateway,
  formEstablishment: FormEstablishmentDto,
): Promise<NafAndNumberOfEmpolyee> => {
  const sireneRepoAnswer = await sireneGateway.get(formEstablishment.siret);
  if (!sireneRepoAnswer || !sireneRepoAnswer.etablissements[0])
    throw new Error(
      `Could not get siret ${formEstablishment.siret} from siren gateway`,
    );

  const sireneEstablishmentVo = new SireneEstablishmentVO(
    sireneRepoAnswer.etablissements[0],
  );

  const nafDto = sireneEstablishmentVo.nafAndNomenclature;
  const numberEmployeesRange = sireneEstablishmentVo.numberEmployeesRange;

  if (!nafDto || numberEmployeesRange === undefined)
    throw new Error(
      `Some field from siren gateway are missing for establishment with siret ${formEstablishment.siret} : nafDto=${nafDto}; numberEmployeesRange=${numberEmployeesRange}`,
    );

  return { nafDto, numberEmployeesRange };
};

const makeCreateEstablishmentAggregate =
  ({ uuidGenerator, clock }: { uuidGenerator: UuidGenerator; clock: Clock }) =>
  ({
    formEstablishment,
    nafAndNumberOfEmployee: { nafDto, numberEmployeesRange },
    addressAndPosition: { address, position },
  }: {
    formEstablishment: FormEstablishmentDto;
    addressAndPosition: AddressAndPosition;
    nafAndNumberOfEmployee: NafAndNumberOfEmpolyee;
  }) => {
    const contact: ContactEntityV2 = {
      id: uuidGenerator.new(),
      ...formEstablishment.businessContact,
    };

    const immersionOffers: ImmersionOfferEntityV2[] =
      formEstablishment.appellations.map(
        appelationToImmersionOfferEntity(clock),
      );

    const establishment: EstablishmentEntityV2 = {
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
      updatedAt: clock.now(),
      isSearchable: formEstablishment.isSearchable,
    };

    const establishmentAggregate: EstablishmentAggregate = {
      establishment,
      contact,
      immersionOffers,
    };

    return establishmentAggregate;
  };
