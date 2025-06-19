import { from, type Observable, Subject } from "rxjs";
import type {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  ConnectedUserJwt,
  CreateAgencyDto,
  InclusionConnectedUser,
  ListAgencyOptionsRequestDto,
  UpdateAgencyStatusParams,
  UserParamsForAgency,
  WithAgencyId,
  WithAgencyIdAndUserId,
} from "shared";
import type { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class TestAgencyGateway implements AgencyGateway {
  public createUserForAgencyResponse$ = new Subject<InclusionConnectedUser>();

  public addAgencyResponse$ = new Subject<undefined>();

  public agencyOptions$ = new Subject<AgencyOption[]>();

  public agencyInfo$ = new Subject<AgencyPublicDisplayDto>();

  public customAgencyId$ = new Subject<AgencyId | undefined>();

  public fetchedAgency$ = new Subject<AgencyDto>();

  public fetchedAgencyUsers$ = new Subject<InclusionConnectedUser[]>();

  public updateAgencyResponse$ = new Subject<undefined>();

  public updateUserAgencyRightResponse$ = new Subject<undefined>();

  public removeUserFromAgencyResponse$ = new Subject<undefined>();

  #agencies: Record<string, AgencyDto> = {};

  addAgency$(_agency: CreateAgencyDto): Observable<void> {
    return this.addAgencyResponse$;
  }

  public createUserForAgency$(
    _params: UserParamsForAgency,
    _token: string,
  ): Observable<InclusionConnectedUser> {
    return this.createUserForAgencyResponse$;
  }

  public getAgencyById$(
    _agencyId: AgencyId,
    _token: ConnectedUserJwt,
  ): Observable<AgencyDto> {
    return this.fetchedAgency$;
  }

  public getAgencyUsers$(
    _agencyId: AgencyId,
    _token: ConnectedUserJwt,
  ): Observable<InclusionConnectedUser[]> {
    return this.fetchedAgencyUsers$;
  }

  public getAgencyPublicInfoById$(
    _agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto> {
    return this.agencyInfo$;
  }

  public listAgencyOptionsByFilter$(
    _filter: ListAgencyOptionsRequestDto,
  ): Observable<AgencyOption[]> {
    return this.agencyOptions$;
  }

  public listAgencyOptionsNeedingReview$(
    _adminToken: ConnectedUserJwt,
  ): Observable<AgencyOption[]> {
    return this.agencyOptions$;
  }

  public updateAgency$(
    _agencyDto: AgencyDto,
    _adminToken: ConnectedUserJwt,
  ): Observable<void> {
    return this.updateAgencyResponse$;
  }

  public updateUserAgencyRight$(): Observable<void> {
    return this.updateUserAgencyRightResponse$;
  }

  public removeUserFromAgency$(
    _params: WithAgencyIdAndUserId,
    _token: string,
  ): Observable<void> {
    return this.removeUserFromAgencyResponse$;
  }

  public validateOrRejectAgency$(
    _: ConnectedUserJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void> {
    return from(this.#validateOrRejectAgency(_, updateAgencyStatusParams.id));
  }

  async #validateOrRejectAgency(
    _: ConnectedUserJwt,
    agencyId: AgencyId,
  ): Promise<void> {
    this.#agencies[agencyId].status = "active";
  }
}
