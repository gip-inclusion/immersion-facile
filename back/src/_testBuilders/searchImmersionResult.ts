import { RomeCode, SearchImmersionResultDto } from "shared";
import { TEST_ROME_LABEL } from "../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { EstablishmentAggregate } from "../domain/immersionOffer/entities/EstablishmentEntity";

export const establishmentToSearchResultByRome = (
  establishmentAggregate: EstablishmentAggregate,
  romeCode: RomeCode,
): SearchImmersionResultDto => ({
  rome: romeCode,
  naf: establishmentAggregate.establishment.nafDto.code,
  nafLabel: establishmentAggregate.establishment.nafDto.nomenclature,
  siret: establishmentAggregate.establishment.siret,
  name: establishmentAggregate.establishment.name,
  numberOfEmployeeRange:
    establishmentAggregate.establishment.numberEmployeesRange,
  voluntaryToImmersion:
    establishmentAggregate.establishment.voluntaryToImmersion,
  additionalInformation:
    establishmentAggregate.establishment.additionalInformation,
  position: establishmentAggregate.establishment.position,
  address: establishmentAggregate.establishment.address,
  contactMode: establishmentAggregate.contact?.contactMethod,
  distance_m: 606885,
  romeLabel: TEST_ROME_LABEL,
  website: establishmentAggregate.establishment.website,
  appellations: establishmentAggregate.immersionOffers
    .filter((immersionOffer) => immersionOffer.romeCode === romeCode)
    .map((immersionOffer) => ({
      appellationCode: immersionOffer.appellationCode,
      appellationLabel: immersionOffer.appellationLabel,
    })),
});
