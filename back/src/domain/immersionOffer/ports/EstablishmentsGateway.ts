import { SearchParams } from "../entities/SearchParams";
import type { UncompleteEstablishmentEntity } from "../entities/UncompleteEstablishmentEntity";

export interface EstablishmentsGateway {
  getEstablishments: (
    searchParams: SearchParams,
  ) => Promise<UncompleteEstablishmentEntity[]>;
}
