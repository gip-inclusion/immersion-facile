/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { Observable, of, Subject } from "rxjs";
import { DepartmentCode } from "shared";
import { AdminToken } from "shared";
import { toAgencyPublicDisplayDto } from "shared";
import {
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared";
import { propEq, propNotEq } from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class TestAgencyGateway implements AgencyGateway {
  public agencies$ = new Subject<AgencyIdAndName[]>();

  listAgencies$(
    _departmentCode: DepartmentCode,
  ): Observable<AgencyIdAndName[]> {
    return this.agencies$;
  }

  getImmersionFacileAgencyId$(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }

  private _agencies: Record<string, AgencyDto> = {};

  async addAgency(createAgencyDto: CreateAgencyDto) {
    this._agencies[createAgencyDto.id] = {
      ...createAgencyDto,
      status: "needsReview",
      adminEmails: [],
      questionnaireUrl: createAgencyDto.questionnaireUrl ?? "",
    };
  }

  async listAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    return values(this._agencies);
  }

  async listPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    return values(this._agencies).filter(propEq("kind", "pole-emploi"));
  }

  async listNonPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    return values(this._agencies).filter(propNotEq("kind", "pole-emploi"));
  }

  async listAgenciesNeedingReview(): Promise<AgencyDto[]> {
    return values(this._agencies).filter(propEq("status", "needsReview"));
  }

  async validateAgency(_: AdminToken, agencyId: AgencyId): Promise<void> {
    this._agencies[agencyId].status = "active";
  }

  async getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const agency = this._agencies[withAgencyId.id];
    if (agency) return toAgencyPublicDisplayDto(agency);
    throw new Error(`Missing agency with id ${withAgencyId.id}.`);
  }
}
