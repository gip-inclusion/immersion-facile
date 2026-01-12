import { keys, toPairs, uniq, values } from "ramda";
import {
  type AddressDto,
  type AgencyId,
  type AgencyKind,
  type AgencyOption,
  type AgencyPositionFilter,
  type AgencyStatus,
  type AgencyWithUsersRights,
  activeAgencyStatuses,
  type DateString,
  type DepartmentCode,
  errors,
  type GeoPositionDto,
  isTruthy,
  isWithAgencyRole,
  type SiretDto,
  type UserId,
  type WithGeoPosition,
  type WithUserFilters,
} from "shared";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import type {
  AgencyRepository,
  AgencyRightOfUser,
  AgencyWithNumberOfUsersToReview,
  GetAgenciesFilters,
  PartialAgencyWithUsersRights,
} from "../ports/AgencyRepository";

type AgencyById = Partial<Record<AgencyId, AgencyWithUsersRights>>;

export class InMemoryAgencyRepository implements AgencyRepository {
  #agencies: AgencyById = {};

  // test purpose only
  public get agencies(): AgencyWithUsersRights[] {
    return values(this.#agencies).filter(isTruthy);
  }

  public set agencies(agencies: AgencyWithUsersRights[]) {
    this.#agencies = agencies.reduce(
      (acc, agency) => ({
        ...acc,
        [agency.id]: agency,
      }),
      {},
    );
  }

  constructor(agencyList: AgencyWithUsersRights[] = testAgencies) {
    agencyList.forEach((agency) => {
      this.#agencies[agency.id] = agency;
    });
  }

  public async insert(
    agency: AgencyWithUsersRights,
    _updatedAt?: DateString,
  ): Promise<void> {
    if (this.#agencies[agency.id]) throw errors.agency.alreadyExist(agency.id);
    if (!values(agency.usersRights).length)
      throw errors.agency.noUsers(agency.id);
    this.#agencies[agency.id] = agency;
  }

  public async update(agency: PartialAgencyWithUsersRights) {
    const agencyToUdpate = this.#agencies[agency.id];
    if (!agencyToUdpate) {
      throw errors.agency.notFound({ agencyId: agency.id });
    }
    this.#agencies[agency.id] = { ...agencyToUdpate, ...agency };
  }

  public async getById(
    id: AgencyId,
  ): Promise<AgencyWithUsersRights | undefined> {
    return this.#agencies[id];
  }

  public async getBySafirAndActiveStatus(
    safirCode: string,
  ): Promise<AgencyWithUsersRights[]> {
    return values(this.#agencies)
      .filter(isTruthy)
      .filter(
        (agency) =>
          agency.codeSafir === safirCode &&
          activeAgencyStatuses.includes(agency.status),
      );
  }

  public async getByIds(ids: AgencyId[]): Promise<AgencyWithUsersRights[]> {
    const result = ids.reduce<{
      agencies: AgencyWithUsersRights[];
      missingIds: AgencyId[];
    }>(
      (prev, id) => {
        const agency = this.#agencies[id];
        return {
          agencies: agency ? [...prev.agencies, agency] : prev.agencies,
          missingIds: !agency ? [...prev.missingIds, id] : prev.missingIds,
        };
      },
      {
        agencies: [],
        missingIds: [],
      },
    );
    if (result.missingIds.length)
      throw errors.agencies.notFound({
        missingAgencyIds: result.missingIds,
        presentAgencyIds: result.agencies.map((agency) => agency.id),
      });
    return result.agencies;
  }

  public async getAgencies({
    filters = {},
    limit,
  }: {
    filters?: GetAgenciesFilters;
    limit?: number;
  }): Promise<AgencyWithUsersRights[]> {
    const filteredAgencies = Object.values(this.#agencies)
      .filter(isTruthy)
      .filter(
        (agency) =>
          ![
            agencyHasDepartmentCode(agency, filters?.departmentCode),
            agencyHasName(agency, filters?.nameIncludes),
            agencyIsOfKind(agency, filters?.kinds),
            agencyIsOfPosition(agency, filters?.position),
            agencyIsOfStatus(agency, filters?.status),
            agencyHasSirets(agency, filters?.sirets),
            agencyDoesNotReferToOtherAgency(
              agency,
              filters?.doesNotReferToOtherAgency,
            ),
            agencyCreatedAtBefore(agency, filters?.createdAtBefore),
          ].includes(false),
      )
      .slice(0, limit);

    return filters?.position
      ? filteredAgencies.sort(sortByNearestFrom(filters.position.position))
      : filteredAgencies;
  }

  public async getAgenciesRelatedToAgency(
    id: AgencyId,
  ): Promise<AgencyWithUsersRights[]> {
    return values(this.#agencies)
      .filter(isTruthy)
      .filter((agency) => agency.refersToAgencyId === id);
  }

  public async getAllAgenciesWithUsersToReview(): Promise<
    AgencyWithNumberOfUsersToReview[]
  > {
    return values(this.#agencies)
      .filter(isTruthy)
      .map((agency) => {
        const numberOfUsersToReview = toPairs(agency.usersRights).filter(
          ([_, right]) => right?.roles.includes("to-review"),
        ).length;

        return {
          agency,
          numberOfUsersToReview,
        };
      })
      .filter((result) => result.numberOfUsersToReview > 0);
  }

  public async getImmersionFacileAgencyId(): Promise<AgencyId> {
    return "immersion-facile-agency";
  }

  public async getUserIdWithAgencyRightsByFilters(
    filters: WithUserFilters,
  ): Promise<UserId[]> {
    if (!isWithAgencyRole(filters)) {
      const agency = this.#agencies[filters.agencyId];
      if (!agency) throw errors.agency.notFound(filters);
      return keys(agency.usersRights);
    }

    return uniq(
      values(this.#agencies)
        .filter(isTruthy)
        .reduce<UserId[]>((acc, agency) => {
          const userIds = toPairs(agency.usersRights)
            .filter(([_, right]) => right?.roles.includes(filters.agencyRole))
            .map(([userId]) => userId);
          return [...acc, ...userIds];
        }, []),
    );
  }

  public async getAgenciesRightsByUserId(
    id: UserId,
  ): Promise<AgencyRightOfUser[]> {
    return values(this.#agencies).reduce<AgencyRightOfUser[]>((acc, agency) => {
      const userRights = agency?.usersRights[id];
      return [
        ...acc,
        ...(userRights
          ? [
              {
                agencyId: agency.id,
                ...userRights,
              } satisfies AgencyRightOfUser,
            ]
          : []),
      ];
    }, []);
  }

  public async alreadyHasActiveAgencyWithSameAddressAndKind({
    address,
    kind,
    idToIgnore,
  }: {
    address: AddressDto;
    kind: AgencyKind;
    idToIgnore: AgencyId;
  }): Promise<boolean> {
    return this.agencies.some(
      (agency) =>
        agency.kind === kind &&
        agency.address.streetNumberAndAddress ===
          address.streetNumberAndAddress &&
        agency.address.city === address.city &&
        agency.status !== "rejected" &&
        agency.id !== idToIgnore,
    );
  }

  public async getExistingActiveSirets(
    sirets: SiretDto[],
  ): Promise<SiretDto[]> {
    return this.agencies
      .filter(
        (agency) =>
          activeAgencyStatuses.includes(agency.status) &&
          sirets.includes(agency.agencySiret),
      )
      .map((agency) => agency.agencySiret);
  }

  public async deleteOldClosedAgenciesWithoutConventions(_params: {
    updatedBefore: Date;
  }): Promise<AgencyId[]> {
    throw errors.generic.fakeError("Not implemented");
  }
}

const sortByNearestFrom =
  (position: GeoPositionDto) =>
  (a: AgencyOption & WithGeoPosition, b: AgencyOption & WithGeoPosition) =>
    distanceBetweenCoordinatesInMeters(a.position, position) -
    distanceBetweenCoordinatesInMeters(b.position, position);

const agencyIsOfKind = (
  agency: AgencyWithUsersRights,
  agencyKinds?: AgencyKind[],
): boolean => {
  if (!agencyKinds) return true;
  return agencyKinds.includes(agency.kind);
};

const agencyIsOfStatus = (
  agency: AgencyWithUsersRights,
  statuses?: AgencyStatus[],
): boolean => {
  if (!statuses) return true;
  return statuses.includes(agency.status);
};

const agencyHasDepartmentCode = (
  agency: AgencyWithUsersRights,
  departmentCode?: DepartmentCode,
): boolean => {
  if (!departmentCode) return true;
  return departmentCode === agency.address.departmentCode;
};

const agencyHasName = (
  agency: AgencyWithUsersRights,
  name?: string,
): boolean => {
  if (!name) return true;
  return agency.name.toLowerCase().includes(name.toLowerCase());
};

const agencyHasSirets = (
  agency: AgencyWithUsersRights,
  sirets?: SiretDto[],
): boolean => {
  if (!sirets || sirets.length === 0) return true;
  return sirets.includes(agency.agencySiret);
};

const agencyDoesNotReferToOtherAgency = (
  agency: AgencyWithUsersRights,
  shouldNotReferToOtherAgency?: true,
): boolean => {
  if (shouldNotReferToOtherAgency === undefined) return true;
  return agency.refersToAgencyId === null;
};

const agencyIsOfPosition = (
  agency: AgencyWithUsersRights,
  positionFilter?: AgencyPositionFilter,
): boolean => {
  if (!positionFilter) return true;
  return (
    distanceBetweenCoordinatesInMeters(
      agency.position,
      positionFilter.position,
    ) <
    positionFilter.distance_km * 1000
  );
};

const agencyCreatedAtBefore = (
  agency: AgencyWithUsersRights,
  createdAtBefore: Date | undefined,
): boolean => {
  if (createdAtBefore === undefined) return true;
  return new Date(agency.createdAt) <= createdAtBefore;
};

const defaultCreatedAt = new Date("2025-02-02").toISOString();

const agency3: AgencyWithUsersRights = {
  id: "test-agency-3-back",
  name: "Test Agency 3 (back)",
  status: "active",
  agencySiret: "00000000000000",
  kind: "pole-emploi",
  usersRights: {
    validatorUserA3: { isNotifiedByEmail: true, roles: ["validator"] },
  },
  signature: "Signature of Test Agency 3",
  coveredDepartments: ["64"],
  address: {
    streetNumberAndAddress: "3 Agency street",
    departmentCode: "64",
    city: "Bayonne",
    postcode: "64100",
  },
  position: {
    lat: 88,
    lon: 89.9999,
  },
  logoUrl: "http://LOGO AGENCY 3 URL",
  refersToAgencyId: null,
  refersToAgencyName: null,
  codeSafir: null,
  statusJustification: null,
  phoneNumber: "+33600000003",
  createdAt: defaultCreatedAt,
};

const agency1: AgencyWithUsersRights = {
  id: "test-agency-1-back",
  name: "Test Agency 1 (back)",
  status: "active",
  kind: "pole-emploi",
  usersRights: {
    counsellorUserA1: { isNotifiedByEmail: true, roles: ["counsellor"] },
    validatorUserA1: { isNotifiedByEmail: true, roles: ["validator"] },
  },
  signature: "Signature of Test Agency 1",
  agencySiret: "00000000000000",
  coveredDepartments: ["75"],
  address: {
    streetNumberAndAddress: "Agency 1 address",
    departmentCode: "75",
    city: "AgencyCity",
    postcode: "75001",
  },
  position: {
    lat: 1,
    lon: 2,
  },
  logoUrl: "http://LOGO AGENCY 1 URL",
  refersToAgencyId: null,
  refersToAgencyName: null,
  codeSafir: null,
  statusJustification: null,
  phoneNumber: "+33600000001",
  createdAt: defaultCreatedAt,
};
const testAgencies: AgencyWithUsersRights[] = [
  {
    id: "immersion-facile-agency",
    name: "Immersion Facile Agency (back)",
    status: "active",
    kind: "immersion-facile",
    usersRights: {
      counsellorUser: { isNotifiedByEmail: true, roles: ["counsellor"] },
      validatorUser: { isNotifiedByEmail: true, roles: ["validator"] },
    },
    signature: "Signature of Immersion Facile",
    agencySiret: "00000000000000",
    coveredDepartments: ["75"],
    address: {
      streetNumberAndAddress: "No address",
      departmentCode: "75",
      city: "NoWhere",
      postcode: "75001",
    },
    position: {
      lat: 22.319469,
      lon: 114.189505,
    },
    logoUrl: "http://LOGO AGENCY IF URL",
    refersToAgencyId: null,
    refersToAgencyName: null,
    codeSafir: null,
    statusJustification: null,
    phoneNumber: "+33600000000",
    createdAt: defaultCreatedAt,
  },
  agency1,
  {
    id: "test-agency-2-back",
    name: "Test Agency 2 (back)",
    status: "active",
    kind: "mission-locale",
    agencySiret: "00000000000000",
    usersRights: {
      counsellorUser1A2: { isNotifiedByEmail: true, roles: ["counsellor"] },
      counsellorUser2A2: { isNotifiedByEmail: true, roles: ["counsellor"] },
      validatorUser1A2: { isNotifiedByEmail: true, roles: ["validator"] },
      validatorUser2A2: { isNotifiedByEmail: true, roles: ["validator"] },
    },
    signature: "Signature of Test Agency 2",
    coveredDepartments: ["68"],
    address: {
      city: "Mulhouse",
      departmentCode: "68",
      postcode: "68100",
      streetNumberAndAddress: "48 Rue Franklin",
    },
    position: {
      lat: 40,
      lon: 50,
    },
    logoUrl: "http://LOGO AGENCY 2 URL",
    refersToAgencyId: null,
    refersToAgencyName: null,
    statusJustification: null,
    codeSafir: null,
    phoneNumber: "+33600000002",
    createdAt: defaultCreatedAt,
  },
  agency3,
  {
    id: "test-agency-4-back-with-refers-to",
    name: "Test Agency 4 (back) - refers to Test Agency 3",
    status: "active",
    agencySiret: "00000000000000",
    kind: "autre",
    usersRights: {
      counsellorUserA4: { isNotifiedByEmail: true, roles: ["counsellor"] },
      validatorUserA4: { isNotifiedByEmail: true, roles: ["validator"] },
    },
    signature: "Signature of Test Agency 4 accompagnante",
    coveredDepartments: ["64"],
    address: {
      streetNumberAndAddress: "4 Agency street",
      departmentCode: "64",
      city: "Bayonne",
      postcode: "64100",
    },
    position: {
      lat: 88,
      lon: 89.9999,
    },
    logoUrl: "http://LOGO AGENCY 4 URL",
    refersToAgencyId: agency3.id,
    refersToAgencyName: agency3.name,
    statusJustification: null,
    codeSafir: null,
    phoneNumber: "+33600000004",
    createdAt: defaultCreatedAt,
  },
  {
    id: "test-agency-5-back-with-refers-to",
    name: "Test Agency 5 (back) - refers to Test Agency 1",
    status: "active",
    agencySiret: "00000000000000",
    kind: "autre",
    usersRights: {
      counsellorUserA5: { isNotifiedByEmail: true, roles: ["counsellor"] },
      validatorUserA1: { isNotifiedByEmail: true, roles: ["validator"] },
    },
    signature: "Signature of Test Agency 5 accompagnante",
    coveredDepartments: ["64"],
    address: {
      streetNumberAndAddress: "5 Agency street",
      departmentCode: "64",
      city: "Bayonne",
      postcode: "64100",
    },
    position: {
      lat: 88,
      lon: 89.9999,
    },
    logoUrl: "http://LOGO AGENCY 5 URL",
    refersToAgencyId: agency1.id,
    refersToAgencyName: agency1.name,
    statusJustification: null,
    codeSafir: null,
    phoneNumber: "+33600000005",
    createdAt: defaultCreatedAt,
  },
];
