import type { Observable } from "rxjs";
import type {
  CreateDiscussionDto,
  DataWithPagination,
  ExternalOfferDto,
  GetExternalOffersFlatQueryParams,
  GetOffersFlatQueryParams,
  GroupSlug,
  GroupWithResults,
  InternalOfferDto,
  SiretAndAppellationDto,
} from "shared";

export type ContactErrorKind = "alreadyContactedRecently";

export interface SearchGateway {
  getOffer$(params: SiretAndAppellationDto): Observable<InternalOfferDto>;
  getOffers$(
    params: GetOffersFlatQueryParams,
  ): Observable<DataWithPagination<InternalOfferDto>>;
  contactEstablishment: (
    params: CreateDiscussionDto,
  ) => Promise<void | ContactErrorKind>;
  getGroupBySlug(groupSlug: GroupSlug): Promise<GroupWithResults>;
  getExternalOffer$(
    params: SiretAndAppellationDto,
  ): Observable<ExternalOfferDto>;
  getExternalOffers$(
    params: GetExternalOffersFlatQueryParams,
  ): Observable<DataWithPagination<ExternalOfferDto>>;
}
