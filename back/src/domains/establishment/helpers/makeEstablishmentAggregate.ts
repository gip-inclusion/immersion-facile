import { FormEstablishmentDto, Location, noContactPerMonth } from "shared";
import { NafAndNumberOfEmpolyee } from "../../../utils/siret";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";

export const makeEstablishmentAggregate = ({
  uuidGenerator,
  timeGateway,
  formEstablishment,
  nafAndNumberOfEmployee,
  addressesAndPosition,
  score = 0,
}: {
  uuidGenerator: UuidGenerator;
  timeGateway: TimeGateway;
  formEstablishment: FormEstablishmentDto;
  addressesAndPosition: Location[];
  nafAndNumberOfEmployee: NafAndNumberOfEmpolyee;
  score?: number;
}): EstablishmentAggregate => ({
  establishment: {
    acquisitionCampaign: formEstablishment.acquisitionCampaign,
    acquisitionKeyword: formEstablishment.acquisitionKeyword,
    locations: addressesAndPosition,
    additionalInformation: formEstablishment.additionalInformation,
    createdAt: timeGateway.now(),
    customizedName: formEstablishment.businessNameCustomized,
    fitForDisabledWorkers: formEstablishment.fitForDisabledWorkers,
    isCommited: formEstablishment.isEngagedEnterprise,
    isOpen: true,
    isSearchable: formEstablishment.maxContactsPerMonth > noContactPerMonth,
    maxContactsPerMonth: formEstablishment.maxContactsPerMonth,
    ...nafAndNumberOfEmployee,
    name: formEstablishment.businessName,
    siret: formEstablishment.siret,
    sourceProvider: formEstablishment.source,
    updatedAt: timeGateway.now(),
    voluntaryToImmersion: true,
    website: formEstablishment.website,
    nextAvailabilityDate: formEstablishment.nextAvailabilityDate,
    searchableBy: formEstablishment.searchableBy,
    score,
  },
  contact: {
    id: uuidGenerator.new(),
    ...formEstablishment.businessContact,
  },
  offers: formEstablishment.appellations.map(
    ({ appellationCode, appellationLabel, romeCode, romeLabel }) => ({
      romeCode,
      appellationCode,
      appellationLabel,
      romeLabel,
      createdAt: timeGateway.now(),
    }),
  ),
});
