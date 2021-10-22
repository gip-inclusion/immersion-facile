import type { EstablishmentEntity } from "../entities/EstablishmentEntity";
import type { SearchParams } from "./ImmersionOfferRepository";
import type { UncompleteEstablishmentEntity } from "../entities/UncompleteEstablishmentEntity";

export interface EstablishmentsGateway {
  getEstablishments: (
    searchParams: SearchParams,
  ) => Promise<UncompleteEstablishmentEntity[]>;
}
