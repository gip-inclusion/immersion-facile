import { FormEstablishmentDto, Location, noContactPerWeek } from "shared";
import { NafAndNumberOfEmpolyee } from "../../../utils/siret";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";

const offerFromFormScore = 10;

export const makeEstablishmentAggregate = ({
  uuidGenerator,
  timeGateway,
  formEstablishment,
  nafAndNumberOfEmployee,
  addressesAndPosition,
}: {
  uuidGenerator: UuidGenerator;
  timeGateway: TimeGateway;
  formEstablishment: FormEstablishmentDto;
  addressesAndPosition: Location[];
  nafAndNumberOfEmployee: NafAndNumberOfEmpolyee;
}): EstablishmentAggregate => ({
  establishment: {
    locations: addressesAndPosition,
    additionalInformation: formEstablishment.additionalInformation,
    createdAt: timeGateway.now(),
    customizedName: formEstablishment.businessNameCustomized,
    fitForDisabledWorkers: formEstablishment.fitForDisabledWorkers,
    isCommited: formEstablishment.isEngagedEnterprise,
    isOpen: true,
    isSearchable: formEstablishment.maxContactsPerWeek > noContactPerWeek,
    maxContactsPerWeek: formEstablishment.maxContactsPerWeek,
    ...nafAndNumberOfEmployee,
    name: formEstablishment.businessName,
    siret: formEstablishment.siret,
    sourceProvider: formEstablishment.source,
    updatedAt: timeGateway.now(),
    voluntaryToImmersion: true,
    website: formEstablishment.website,
    nextAvailabilityDate: formEstablishment.nextAvailabilityDate,
    searchableBy: {
      jobSeekers: true,
      students: true,
    },
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
      score: offerFromFormScore,
      createdAt: timeGateway.now(),
    }),
  ),
});
