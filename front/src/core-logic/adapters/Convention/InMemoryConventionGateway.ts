import { type Observable, Subject, from } from "rxjs";
import {
  type AddConventionInput,
  type AgencyOption,
  type ApiConsumerName,
  type ConnectedUserJwt,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionJwt,
  type ConventionReadDto,
  type ConventionSupportedJwt,
  type DashboardUrlAndName,
  type FindSimilarConventionsParams,
  type RenewConventionParams,
  type RenewMagicLinkRequestDto,
  type SendSignatureLinkRequestDto,
  type ShareLinkByEmailDto,
  type UpdateConventionStatusRequestDto,
  type WithConventionId,
  sleep,
} from "shared";
import type { FetchConventionRequestedPayload } from "src/core-logic/domain/convention/convention.slice";
import type { ConventionGateway } from "src/core-logic/ports/ConventionGateway";

const CONVENTION_DRAFT_TEST = new ConventionDtoBuilder()
  .withStatus("DRAFT")
  .build();

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

  #agencies: { [id: string]: AgencyOption } = {};

  #conventions: { [id: string]: ConventionDto } = {
    [CONVENTION_DRAFT_TEST.id]: CONVENTION_DRAFT_TEST,
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

  public getApiConsumersByConvention$(
    _params: WithConventionId,
    _jwt: ConnectedUserJwt,
  ): Observable<ApiConsumerName[]> {
    return this.getApiConsumersByconventionResult$;
  }

  public getConventionStatusDashboardUrl$(_jwt: string) {
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

  public async renewMagicLink(_: RenewMagicLinkRequestDto): Promise<void> {
    // This is supposed to ask the backend to send a new email to the owner of the expired magic link.
    // Since this operation makes no sense for local development, the implementation here is left empty.
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    throw new Error("500 Not Implemented In InMemory Gateway");
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

  public async shareConventionLinkByEmail(
    _shareLinkByEmailDTO: ShareLinkByEmailDto,
  ): Promise<boolean> {
    return true;
  }

  public signConvention$(
    _conventionId: ConventionId,
    _jwt: ConventionJwt | ConnectedUserJwt,
  ): Observable<void> {
    return this.conventionSignedResult$;
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
      agencyDepartment: "75",
      agencyKind: "mission-locale",
      agencySiret: "22220000222200",
      agencyCounsellorEmails: [],
      agencyValidatorEmails: ["validator@mail.com"],
    };
  }
}
