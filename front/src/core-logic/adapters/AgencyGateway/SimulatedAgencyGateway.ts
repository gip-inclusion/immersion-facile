import { values } from "ramda";
import { from, type Observable, of, Subject, throwError } from "rxjs";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyId,
  type AgencyOption,
  type AgencyPublicDisplayDto,
  type ConnectedUserJwt,
  type CreateAgencyDto,
  errors,
  type InclusionConnectedUser,
  type ListAgencyOptionsRequestDto,
  toAgencyDtoForAgencyUsersAndAdmins,
  toAgencyPublicDisplayDto,
  type UpdateAgencyStatusParams,
  type UserParamsForAgency,
  type WithAgencyId,
  type WithAgencyIdAndUserId,
} from "shared";
import type { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

const MISSION_LOCAL_AGENCY_ACTIVE = new AgencyDtoBuilder()
  .withId("test-agency-1-front")
  .withName("Test Agency 1 (front)")
  .withAddress({
    streetNumberAndAddress: "Agency 1",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
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

const simulatedUsers: InclusionConnectedUser[] = [
  {
    id: "fake-user-id-1",
    email: "jbon8745@wanadoo.fr",
    firstName: "Jean",
    lastName: "Bon",
    agencyRights: [
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(
          MISSION_LOCAL_AGENCY_ACTIVE,
          [],
        ),
        isNotifiedByEmail: true,
        roles: ["agency-admin"],
      },
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(PE_AGENCY_ACTIVE, []),
        isNotifiedByEmail: true,
        roles: ["validator"],
      },
    ],
    dashboards: { agencies: {}, establishments: {} },
    proConnect: {
      externalId: "fake-user-external-id-1",
      siret: "00000000001111",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "fake-user-id-2",
    email: "remi@sanfamille.fr",
    firstName: "Rémi",
    lastName: "Sanfamille",
    agencyRights: [],
    dashboards: { agencies: {}, establishments: {} },
    proConnect: {
      externalId: "fake-user-external-id-2",
      siret: "00000000002222",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-in-error",
    email: "fake-user-email-4@test.fr",
    firstName: "Jean-Michel",
    lastName: "Jeplante",
    agencyRights: [
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(PE_AGENCY_ACTIVE, []),
        isNotifiedByEmail: true,
        roles: ["agency-admin"],
      },
    ],
    dashboards: { agencies: {}, establishments: {} },
    proConnect: {
      externalId: "fake-user-in-error-external-id",
      siret: "00000000006666",
    },
    createdAt: new Date().toISOString(),
  },
];

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
      codeSafir: null,
      rejectionJustification: null,
    };
  }

  public createUserForAgency$(
    { agencyId }: UserParamsForAgency,
    _token: string,
  ): Observable<InclusionConnectedUser> {
    return agencyId === "non-existing-agency-id"
      ? throwError(() => new Error(`Agency Id ${agencyId} not found`))
      : of({
          id: "fake-user-id-2",
          email: "remi@sanfamille.fr",
          firstName: "Rémi",
          lastName: "Sanfamille",
          agencyRights: [],
          dashboards: { agencies: {}, establishments: {} },
          proConnect: {
            externalId: "fake-user-external-id-2",
            siret: "00000000002222",
          },
          createdAt: new Date().toISOString(),
        });
  }

  public getAgencyById$(
    agencyId: AgencyId,
    _token: ConnectedUserJwt,
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

  getAgencyUsers$(
    agencyId: AgencyId,
    _token: ConnectedUserJwt,
  ): Observable<InclusionConnectedUser[]> {
    return of(
      simulatedUsers.filter((user) =>
        user.agencyRights.some(
          (agencyRight) => agencyRight.agency.id === agencyId,
        ),
      ),
    );
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
    _adminToken: ConnectedUserJwt,
  ): Observable<AgencyOption[]> {
    return of(
      values(this.#agencies)
        .filter((agency) => agency.status === "needsReview")
        .map((agency) => ({
          id: agency.id,
          name: agency.name,
          kind: agency.kind,
          status: agency.status,
          address: agency.address,
          refersToAgencyName: agency.refersToAgencyName,
        })),
    );
  }

  public updateAgency$(): Observable<void> {
    return of(undefined);
  }

  public updateUserAgencyRight$(
    { agencyId }: UserParamsForAgency,
    _token: string,
  ): Observable<void> {
    return agencyId === "non-existing-agency-id"
      ? throwError(() => new Error(`Agency Id ${agencyId} not found`))
      : of(undefined);
  }

  public removeUserFromAgency$(
    _params: WithAgencyIdAndUserId,
    _token: string,
  ): Observable<void> {
    return of(undefined);
  }

  public validateOrRejectAgency$(
    adminToken: ConnectedUserJwt,
    updateAgencyStatusParams: UpdateAgencyStatusParams,
  ): Observable<void> {
    return from(
      this.#validateOrRejectAgency(adminToken, updateAgencyStatusParams.id),
    );
  }

  async #validateOrRejectAgency(
    _: ConnectedUserJwt,
    agencyId: AgencyId,
  ): Promise<void> {
    this.#agencies[agencyId].status = "active";
  }
}
