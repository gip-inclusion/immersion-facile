import { from, type Observable, Subject } from "rxjs";
import {
  type AddConventionInput,
  type AgencyOption,
  type ApiConsumerName,
  type ConnectedUserJwt,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionJwt,
  type ConventionLastBroadcastFeedbackResponse,
  type ConventionReadDto,
  type ConventionSupportedJwt,
  type DashboardUrlAndName,
  type DataWithPagination,
  type EditConventionCounsellorNameRequestDto,
  type FindSimilarConventionsParams,
  type FlatGetConventionsForAgencyUserParams,
  type MarkPartnersErroredConventionAsHandledRequest,
  type PaginationQueryParams,
  type RenewConventionParams,
  type SendSignatureLinkRequestDto,
  type ShareConventionDraftByEmailDto,
  sleep,
  type TransferConventionToAgencyRequestDto,
  type UpdateConventionStatusRequestDto,
  type WithConventionId,
} from "shared";
import type { FetchConventionRequestedPayload } from "src/core-logic/domain/convention/convention.slice";
import type { ConventionGateway } from "src/core-logic/ports/ConventionGateway";
import type { ConventionWithBroadcastFeedback } from "../../../../../shared/src/convention/conventionWithBroadcastFeedback.dto";

const CONVENTION_VALIDATED_TEST = new ConventionDtoBuilder()
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

export class InMemoryConventionGateway implements ConventionGateway {
  public addConventionCallCount = 0;

  public addConventionResult$ = new Subject<void>();

  // For testing purpose
  public convention$ = new Subject<ConventionReadDto | undefined>();

  public conventionDashboardUrl$ = new Subject<DashboardUrlAndName>();

  public conventionModificationResult$ = new Subject<void>();

  public conventionRenewalResult$ = new Subject<void>();

  public conventionSignedResult$ = new Subject<void>();

  public getApiConsumersByconventionResult$ = new Subject<ApiConsumerName[]>();

  public getSimilarConventionsResult$ = new Subject<ConventionId[]>();

  public updateConventionCallCount = 0;

  public updateConventionResult$ = new Subject<void>();

  public broadcastConventionAgainResult$ = new Subject<void>();

  public sendSignatureLinkResult$ = new Subject<void>();

  public transferConventionToAgencyResult$ = new Subject<void>();

  public editConventionCounsellorNameResult$ = new Subject<void>();

  public markPartnersErroredConventionAsHandledResult$ = new Subject<void>();

  public getConventionsForUserResult$ = new Subject<
    DataWithPagination<ConventionReadDto>
  >();
  public getConventionLastBroadcastFeedbackResult$ =
    new Subject<ConventionLastBroadcastFeedbackResponse>();

  public getConventionsWithErroredBroadcastFeedbackResult$ = new Subject<
    DataWithPagination<ConventionWithBroadcastFeedback>
  >();

  #agencies: { [id: string]: AgencyOption } = {};

  #conventions: { [id: string]: ConventionDto } = {
    [CONVENTION_VALIDATED_TEST.id]: CONVENTION_VALIDATED_TEST,
  };

  constructor(private simulatedLatency?: number) {}

  broadcastConventionAgain$(
    _params: WithConventionId,
    _jwt: ConnectedUserJwt,
  ): Observable<void> {
    return this.broadcastConventionAgainResult$;
  }

  public createConvention$(_params: AddConventionInput): Observable<void> {
    this.addConventionCallCount++;
    return this.addConventionResult$;
  }

  public editConventionCounsellorName$(
    _params: EditConventionCounsellorNameRequestDto,
    _jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return this.editConventionCounsellorNameResult$;
  }

  public getApiConsumersByConvention$(
    _params: WithConventionId,
    _jwt: ConnectedUserJwt,
  ): Observable<ApiConsumerName[]> {
    return this.getApiConsumersByconventionResult$;
  }

  public getConventionStatusDashboardUrl$(
    _conventionId: ConventionId,
    _jwt: ConventionJwt,
  ) {
    return this.conventionDashboardUrl$;
  }

  public getSimilarConventions$(
    _findSimilarConventionsParams: FindSimilarConventionsParams,
  ): Observable<ConventionId[]> {
    return this.getSimilarConventionsResult$;
  }

  public sendSignatureLink$(
    _params: SendSignatureLinkRequestDto,
    _jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return this.sendSignatureLinkResult$;
  }

  public renewConvention$(
    _params: RenewConventionParams,
    _jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return this.conventionRenewalResult$;
  }

  public async retreiveById(id: ConventionId): Promise<ConventionReadDto> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    return this.#inferConventionReadDto(this.#conventions[id]);
  }

  public retrieveFromToken$(
    payload: FetchConventionRequestedPayload,
  ): Observable<ConventionReadDto | undefined> {
    return this.simulatedLatency
      ? from(this.#getMagicLink(payload))
      : this.convention$;
  }

  public async shareConventionDraftByEmail(
    _shareLinkByEmailDTO: ShareConventionDraftByEmailDto,
  ): Promise<boolean> {
    return true;
  }

  public signConvention$(
    _conventionId: ConventionId,
    _jwt: ConventionJwt | ConnectedUserJwt,
  ): Observable<void> {
    return this.conventionSignedResult$;
  }

  public transferConventionToAgency$(
    _params: TransferConventionToAgencyRequestDto,
    _jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return this.transferConventionToAgencyResult$;
  }

  public updateConvention$(
    _conventionDto: ConventionDto,
    _jwt: string,
  ): Observable<void> {
    this.updateConventionCallCount++;
    return this.updateConventionResult$;
  }

  public updateConventionStatus$(
    _params: UpdateConventionStatusRequestDto,
    _jwt: string,
  ): Observable<void> {
    return this.conventionModificationResult$;
  }

  // Same as GET above, but using a magic link
  async #getMagicLink({
    conventionId,
  }: FetchConventionRequestedPayload): Promise<ConventionReadDto> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    return this.#inferConventionReadDto(this.#conventions[conventionId]);
  }

  #inferConventionReadDto(convention: ConventionDto): ConventionReadDto {
    return {
      ...convention,
      agencyName: this.#agencies[convention.agencyId]?.name ?? "agency-name",
      agencyContactEmail: "contact@mail.com",
      agencyDepartment: "75",
      agencyKind: "mission-locale",
      agencySiret: "22220000222200",
      agencyCounsellorEmails: [],
      agencyValidatorEmails: ["validator@mail.com"],
      assessment: null,
    };
  }

  public markPartnersErroredConventionAsHandled$(
    _params: MarkPartnersErroredConventionAsHandledRequest,
    _jwt: string,
  ): Observable<void> {
    return this.markPartnersErroredConventionAsHandledResult$;
  }

  public getConventionsForUser$(
    _params: FlatGetConventionsForAgencyUserParams,
    _jwt: string,
  ): Observable<DataWithPagination<ConventionReadDto>> {
    return this.getConventionsForUserResult$;
  }
  public getConventionLastBroadcastFeedback$(
    _conventionId: ConventionId,
    _jwt: ConventionSupportedJwt,
  ): Observable<ConventionLastBroadcastFeedbackResponse> {
    return this.getConventionLastBroadcastFeedbackResult$;
  }

  public getConventionsWithErroredBroadcastFeedback$(
    _params: Required<PaginationQueryParams>,
    _jwt: string,
  ): Observable<DataWithPagination<ConventionWithBroadcastFeedback>> {
    return this.getConventionsWithErroredBroadcastFeedbackResult$;
  }
}
