import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { SiretDto } from "shared/src/siret";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../entities/EstablishmentEntity";
import { SearchMade } from "../entities/SearchMadeEntity";

export interface EstablishmentAggregateRepository {
  hasEstablishmentFromFormWithSiret: (siret: string) => Promise<boolean>;
  insertEstablishmentAggregates: (
    establishmentAggregates: EstablishmentAggregate[],
  ) => Promise<void>;
  updateEstablishmentAggregate: (
    establishmentAggregate: EstablishmentAggregate,
    updatedAt: Date,
  ) => Promise<void>;
  getSearchImmersionResultDtoFromSearchMade: (props: {
    searchMade: SearchMade;
    withContactDetails?: boolean;
    maxResults?: number;
  }) => Promise<SearchImmersionResultDto[]>;

  getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince: (
    since: Date,
  ) => Promise<SiretDto[]>;

  getSiretOfEstablishmentsFromFormSource: () => Promise<SiretDto[]>;

  updateEstablishment: (
    propertiesToUpdate: Partial<EstablishmentEntityV2> & {
      updatedAt: Date;
      siret: SiretDto;
    },
  ) => Promise<void>;

  removeEstablishmentAndOffersAndContactWithSiret: (
    siret: string,
  ) => Promise<void>;

  getEstablishmentAggregateBySiret: (
    siret: string,
  ) => Promise<EstablishmentAggregate | undefined>;

  getOffersAsAppelationDtoForFormEstablishment: (
    siret: string,
  ) => Promise<AppellationDto[]>;
  getSearchImmersionResultDtoBySiretAndRome: (
    siret: SiretDto,
    rome: string,
  ) => Promise<SearchImmersionResultDto | undefined>;
}
