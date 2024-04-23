/* eslint-disable  @typescript-eslint/require-await */
import { Observable, Subject, from } from "rxjs";
import {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  InclusionConnectJwt,
  CreateAgencyDto,
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

  public fetchedAgency$ = new Subject<AgencyDto | undefined>();

  public updateAgencyResponse$ = new Subject<undefined>();

  public addAgencyResponse$ = new Subject<undefined>();

  #agencies: Record<string, AgencyDto> = {};

  public getAgencyAdminById$(
    _agencyId: AgencyId,
    _adminToken: InclusionConnectJwt,
  ): Observable<AgencyDto | undefined> {
    return this.fetchedAgency$;
  }

  public getAgencyPublicInfoById$(
    _agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto> {
    return this.agencyInfo$;
  }

  public getImmersionFacileAgencyId$(): Observable<AgencyId | undefined> {
    return this.customAgencyId$;
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
