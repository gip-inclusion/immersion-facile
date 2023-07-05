import { RomeCode, SearchImmersionResultDto } from "shared";
import { TEST_ROME_LABEL } from "../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { EstablishmentAggregate } from "../domain/immersionOffer/entities/EstablishmentEntity";

export const establishmentToSearchResultByRome = (
  establishmentAggregate: EstablishmentAggregate,
  romeCode: RomeCode,
  withContactDetails: boolean,
  distance_m?: number,
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
  distance_m,
  romeLabel: TEST_ROME_LABEL,
  website: establishmentAggregate.establishment.website,
  appellations: establishmentAggregate.immersionOffers
    .filter((immersionOffer) => immersionOffer.romeCode === romeCode)
    .map((immersionOffer) => ({
      appellationCode: immersionOffer.appellationCode,
      appellationLabel: immersionOffer.appellationLabel,
    })),
  ...(withContactDetails && establishmentAggregate.contact
    ? {
        contactDetails: {
          id: establishmentAggregate.contact.id,
          email: establishmentAggregate.contact.email,
          firstName: establishmentAggregate.contact.firstName,
          lastName: establishmentAggregate.contact.lastName,
          job: establishmentAggregate.contact.job,
          phone: establishmentAggregate.contact.phone,
        },
      }
    : undefined),
});
