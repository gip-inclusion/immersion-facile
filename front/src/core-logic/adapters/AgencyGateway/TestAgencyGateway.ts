/* eslint-disable  @typescript-eslint/require-await */
import { Observable, Subject, from } from "rxjs";
import {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  InclusionConnectJwt,
  InclusionConnectedUser,
  ListAgencyOptionsRequestDto,
  UpdateAgencyStatusParams,
  WithAgencyId,
} from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class TestAgencyGateway implements AgencyGateway {
  addAgency$(_agency: CreateAgencyDto): Observable<void> {
    return this.addAgencyResponse$;
  }

  public agencyOptions$ = new Subject<AgencyOption[]>();

  public agencyInfo$ = new Subject<AgencyPublicDisplayDto>();

  public customAgencyId$ = new Subject<AgencyId | undefined>();

  public fetchedAgencyForAdmin$ = new Subject<AgencyDto | undefined>();

  public fetchedAgencyForDashboard$ = new Subject<AgencyDto>();

  public fetchedAgencyUsers$ = new Subject<InclusionConnectedUser[]>();

  public updateAgencyResponse$ = new Subject<undefined>();

  public updateUserAgencyRightResponse$ = new Subject<undefined>();
  public updateAgencyFromDashboardResponse$ = new Subject<undefined>();

  public addAgencyResponse$ = new Subject<undefined>();

  #agencies: Record<string, AgencyDto> = {};

  public getAgencyAdminById$(
    _agencyId: AgencyId,
    _adminToken: InclusionConnectJwt,
  ): Observable<AgencyDto | undefined> {
    return this.fetchedAgencyForAdmin$;
  }

  public getAgencyForDashboardById$(
    _agencyId: AgencyId,
    _token: InclusionConnectJwt,
  ): Observable<AgencyDto> {
    return this.fetchedAgencyForDashboard$;
  }

  public getAgencyUsers$(
    _agencyId: AgencyId,
    _token: InclusionConnectJwt,
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
    _adminToken: InclusionConnectJwt,
  ): Observable<AgencyOption[]> {
    return this.agencyOptions$;
  }

  public updateAgency$(
    _agencyDto: AgencyDto,
    _adminToken: InclusionConnectJwt,
  ): Observable<void> {
    return this.updateAgencyResponse$;
  }

  public updateUserAgencyRight$(): Observable<void> {
    return this.updateUserAgencyRightResponse$;
  }

  public updateAgencyFromDashboard$(
    _agencyDto: AgencyDto,
    _adminToken: InclusionConnectJwt,
  ): Observable<void> {
    return this.updateAgencyFromDashboardResponse$;
  }

  public validateOrRejectAgency$(
    _: InclusionConnectJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void> {
    return from(this.#validateOrRejectAgency(_, updateAgencyStatusParams.id));
  }

  async #validateOrRejectAgency(
    _: InclusionConnectJwt,
    agencyId: AgencyId,
  ): Promise<void> {
    this.#agencies[agencyId].status = "active";
  }
}
