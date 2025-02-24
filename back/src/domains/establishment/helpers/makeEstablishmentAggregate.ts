import { FormEstablishmentDto, Location, noContactPerMonth } from "shared";
import { NafAndNumberOfEmpolyee } from "../../../utils/siret";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import {
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../entities/EstablishmentAggregate";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";

export const makeEstablishmentAggregate = ({
  timeGateway,
  formEstablishment,
  nafAndNumberOfEmployee,
  addressesAndPosition,
  score = 0,
  userRights,
  existingEntity,
}: {
  timeGateway: TimeGateway;
  formEstablishment: FormEstablishmentDto;
  addressesAndPosition: Location[];
  nafAndNumberOfEmployee: NafAndNumberOfEmpolyee;
  score?: number;
  userRights: EstablishmentUserRight[];
  existingEntity?: EstablishmentEntity;
}): EstablishmentAggregate => ({
  establishment: {
    acquisitionCampaign: formEstablishment.acquisitionCampaign,
    acquisitionKeyword: formEstablishment.acquisitionKeyword,
    locations: addressesAndPosition,
    additionalInformation: formEstablishment.additionalInformation,
    createdAt: existingEntity ? existingEntity.createdAt : timeGateway.now(),
    customizedName: formEstablishment.businessNameCustomized,
    fitForDisabledWorkers: formEstablishment.fitForDisabledWorkers,
    isCommited: formEstablishment.isEngagedEnterprise,
    isOpen: true,
    isMaxDiscussionsForPeriodReached:
      formEstablishment.maxContactsPerMonth <= noContactPerMonth,
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
    contactMethod: formEstablishment.businessContact.contactMethod,
  },
  userRights: userRights,
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
