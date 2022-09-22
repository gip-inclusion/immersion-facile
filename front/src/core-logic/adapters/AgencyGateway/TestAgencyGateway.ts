/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { map, Observable, of, Subject } from "rxjs";
import { DepartmentCode } from "shared/src/address/address.dto";
import { AdminToken } from "shared/src/admin/admin.dto";
import { toAgencyPublicDisplayDto } from "shared/src/agency/agency";
import {
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { propEq, propNotEq } from "shared/src/ramdaExtensions/propEq";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

type TestAgency = AgencyIdAndName & {
  departmentCode: DepartmentCode;
};

const toAgencyIdAndName = (testAgency: TestAgency): AgencyIdAndName => ({
  id: testAgency.id,
  name: testAgency.name,
});

export class TestAgencyGateway implements AgencyGateway {
  public agencies$ = new Subject<TestAgency[]>();

  listAgencies$(departmentCode: DepartmentCode): Observable<AgencyIdAndName[]> {
    return this.agencies$.pipe(
      map((agencies: TestAgency[]) =>
        agencies
          .filter(
            (agency: TestAgency) => agency.departmentCode === departmentCode,
          )
          .map(toAgencyIdAndName),
      ),
    );
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
