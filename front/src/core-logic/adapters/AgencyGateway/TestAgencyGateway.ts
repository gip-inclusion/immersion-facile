/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { from, Observable, Subject } from "rxjs";
import {
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  BackOfficeJwt,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  propEq,
  propNotEq,
  toAgencyPublicDisplayDto,
  WithAgencyId,
} from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class TestAgencyGateway implements AgencyGateway {
  public agencies$ = new Subject<AgencyOption[]>();

  public agencyInfo$ = new Subject<AgencyPublicDisplayDto>();

  public customAgencyId$ = new Subject<AgencyId | undefined>();

  public fetchedAgency$ = new Subject<AgencyDto | undefined>();

  public updateAgencyResponse$ = new Subject<undefined>();

  #agencies: Record<string, AgencyDto> = {};

  public async addAgency(createAgencyDto: CreateAgencyDto) {
    this.#agencies[createAgencyDto.id] = {
      ...createAgencyDto,
      status: "needsReview",
      adminEmails: [],
      questionnaireUrl: createAgencyDto.questionnaireUrl ?? "",
    };
  }

  public getAgencyAdminById$(
    _agencyId: AgencyId,
    _adminToken: BackOfficeJwt,
  ): Observable<AgencyDto | undefined> {
    return this.fetchedAgency$;
  }

  public async getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const agency = this.#agencies[withAgencyId.agencyId];
    if (agency) return toAgencyPublicDisplayDto(agency);
    throw new Error(`Missing agency with id ${withAgencyId.agencyId}.`);
  }

  public getAgencyPublicInfoById$(
    _agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto> {
    return this.agencyInfo$;
  }

  public async getFilteredAgencies(
    _filter: ListAgenciesRequestDto,
  ): Promise<AgencyOption[]> {
    throw new Error(`Not implemented`);
  }

  public getImmersionFacileAgencyId$(): Observable<AgencyId | undefined> {
    return this.customAgencyId$;
  }

  public listAgenciesByFilter$(
    _filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]> {
    return this.agencies$;
  }

  public listAgenciesNeedingReview$(
    _adminToken: BackOfficeJwt,
  ): Observable<AgencyOption[]> {
    return this.agencies$;
  }

  public async listImmersionAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies);
  }

  public async listImmersionOnlyPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies).filter(propEq("kind", "pole-emploi"));
  }

  public async listImmersionWithoutPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies).filter(propNotEq("kind", "pole-emploi"));
  }

  public async listMiniStageAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies).filter(propNotEq("kind", "cci"));
  }

  public updateAgency$(
    _agencyDto: AgencyDto,
    _adminToken: BackOfficeJwt,
  ): Observable<void> {
    return this.updateAgencyResponse$;
  }

  public validateOrRejectAgency$(
    _: BackOfficeJwt,
    agencyId: AgencyId,
  ): Observable<void> {
    return from(this.#validateOrRejectAgency(_, agencyId));
  }

  async #validateOrRejectAgency(
    _: BackOfficeJwt,
    agencyId: AgencyId,
  ): Promise<void> {
    this.#agencies[agencyId].status = "active";
  }
}
