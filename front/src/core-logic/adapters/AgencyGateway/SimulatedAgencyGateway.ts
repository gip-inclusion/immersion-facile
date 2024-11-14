/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { Observable, Subject, from, of } from "rxjs";
import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  InclusionConnectJwt,
  ListAgencyOptionsRequestDto,
  UpdateAgencyStatusParams,
  WithAgencyId,
  errors,
  toAgencyPublicDisplayDto,
} from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

const MISSION_LOCAL_AGENCY_ACTIVE = new AgencyDtoBuilder()
  .withId("test-agency-1-front")
  .withName("Test Agency 1 (front)")
  .withAddress({
    streetNumberAndAddress: "Agency 1",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
  .withQuestionnaireUrl("https://www.questionnaireMissionLocale.com")
  .withKind("mission-locale")
  .withStatus("active")
  .build();

export const PE_AGENCY_ACTIVE = new AgencyDtoBuilder()
  .withId("PE-test-agency-2-front")
  .withName("Test Agency 2 PE (front)")
  .withAddress({
    streetNumberAndAddress: "Agency 2",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
  .withQuestionnaireUrl("https://www.PE.com")
  .withKind("pole-emploi")
  .withSignature("Mon agence PE")
  .withStatus("active")
  .build();

const CCI_ACTIVE = new AgencyDtoBuilder()
  .withId("CCI-test-agency")
  .withName("Test Agency CCI")
  .withAddress({
    streetNumberAndAddress: "CCI",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
  .withKind("cci")
  .withSignature("CCI Agency")
  .withStatus("active")
  .build();

export const AGENCY_NEEDING_REVIEW_1 = new AgencyDtoBuilder()
  .withId("PE-test-agency-needs-review-1-front")
  .withName("Test Agency Needs review 1 (front)")
  .withStatus("needsReview")
  .build();

export const AGENCY_NEEDING_REVIEW_2 = new AgencyDtoBuilder()
  .withId("PE-test-agency-needs-review-2-front")
  .withName("Test Agency Needs review 2 (front)")
  .withStatus("needsReview")
  .build();

export class SimulatedAgencyGateway implements AgencyGateway {
  addAgency$(_agency: CreateAgencyDto): Observable<void> {
    return of(undefined);
  }

  public agencyInfo$ = new Subject<AgencyPublicDisplayDto>();

  #agencies: Record<string, AgencyDto> = {
    [MISSION_LOCAL_AGENCY_ACTIVE.id]: MISSION_LOCAL_AGENCY_ACTIVE,
    [PE_AGENCY_ACTIVE.id]: PE_AGENCY_ACTIVE,
    [AGENCY_NEEDING_REVIEW_1.id]: AGENCY_NEEDING_REVIEW_1,
    [AGENCY_NEEDING_REVIEW_2.id]: AGENCY_NEEDING_REVIEW_2,
    [CCI_ACTIVE.id]: CCI_ACTIVE,
  };

  public async addAgency(createAgencyDto: CreateAgencyDto) {
    this.#agencies[createAgencyDto.id] = {
      ...createAgencyDto,
      status: "needsReview",
      questionnaireUrl: createAgencyDto.questionnaireUrl,
      codeSafir: null,
      rejectionJustification: null,
    };
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    _adminToken: InclusionConnectJwt,
  ): Observable<AgencyDto> {
    return of(this.#agencies[agencyId]);
  }

  public getAgencyPublicInfoById$({
    agencyId,
  }: WithAgencyId): Observable<AgencyPublicDisplayDto> {
    const agency = this.#agencies[agencyId];

    if (agency) {
      return of(
        toAgencyPublicDisplayDto(
          agency,
          this.#agencies[MISSION_LOCAL_AGENCY_ACTIVE.id],
        ),
      );
    }
    throw errors.agency.notFound({ agencyId });
  }

  public getImmersionFacileAgencyId$(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }

  public listAgencyOptionsByFilter$(
    _filter: ListAgencyOptionsRequestDto,
  ): Observable<AgencyOption[]> {
    return of(values(this.#agencies));
  }

  public listAgencyOptionsNeedingReview$(
    _adminToken: InclusionConnectJwt,
  ): Observable<AgencyOption[]> {
    return of(
      values(this.#agencies)
        .filter((agency) => agency.status === "needsReview")
        .map((agency) => ({
          id: agency.id,
          name: agency.name,
          kind: agency.kind,
          status: agency.status,
        })),
    );
  }

  public updateAgency$(): Observable<void> {
    return of(undefined);
  }

  public validateOrRejectAgency$(
    adminToken: InclusionConnectJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void> {
    return from(
      this.#validateOrRejectAgency(adminToken, updateAgencyStatusParams.id),
    );
  }

  async #validateOrRejectAgency(
    _: InclusionConnectJwt,
    agencyId: AgencyId,
  ): Promise<void> {
    this.#agencies[agencyId].status = "active";
  }
}
