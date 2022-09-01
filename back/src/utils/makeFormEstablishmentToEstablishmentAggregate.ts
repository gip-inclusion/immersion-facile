import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { Clock } from "../domain/core/ports/Clock";
import { UuidGenerator } from "../domain/core/ports/UuidGenerator";
import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { AddressGateway } from "../domain/immersionOffer/ports/AddressGateway";
import { SireneGateway } from "../domain/sirene/ports/SireneGateway";
import { SireneEstablishmentVO } from "../domain/sirene/valueObjects/SireneEstablishmentVO";
import { notifyAndThrowErrorDiscord } from "./notifyDiscord";

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
  addressAPI,
  sireneGateway,
}: {
  uuidGenerator: UuidGenerator;
  clock: Clock;
  addressAPI: AddressGateway;
  sireneGateway: SireneGateway;
}) => {
  const formEstablishmentToEstablishmentAggregate = async (
    formEstablishment: FormEstablishmentDto,
  ): Promise<EstablishmentAggregate | undefined> => {
    const positionAndAddress = (
      await addressAPI.lookupStreetAddress(formEstablishment.businessAddress)
    ).at(0);

    // TODO This is often problematic with the InMemoryAddressApi, what can be done ?
    if (!positionAndAddress) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Cannot find the address ${formEstablishment.businessAddress} in API for establishment with siret ${formEstablishment.siret}`,
        ),
      );
      return;
    }
    const { address, position } = positionAndAddress;

    const sireneRepoAnswer = await sireneGateway.get(formEstablishment.siret);
    if (!sireneRepoAnswer || !sireneRepoAnswer.etablissements[0]) {
      await notifyAndThrowErrorDiscord(
        new Error(
          `Could not get siret ${formEstablishment.siret} from siren gateway`,
        ),
      );
      return;
    }
    const sireneEstablishmentVo = new SireneEstablishmentVO(
      sireneRepoAnswer.etablissements[0],
    );

    const nafDto = sireneEstablishmentVo.nafAndNomenclature;
    const numberEmployeesRange = sireneEstablishmentVo.numberEmployeesRange;

    if (!nafDto || numberEmployeesRange === undefined) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Some field from siren gateway are missing for establishment with siret ${formEstablishment.siret} : nafDto=${nafDto}; position=${position}; numberEmployeesRange=${numberEmployeesRange}`,
        ),
      );
      return;
    }

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

  return formEstablishmentToEstablishmentAggregate;
};
