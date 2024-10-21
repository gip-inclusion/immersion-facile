import { keys, toPairs, uniq, values } from "ramda";
import {
  AddressDto,
  AgencyId,
  AgencyKind,
  AgencyOption,
  AgencyPositionFilter,
  AgencyStatus,
  DepartmentCode,
  GeoPositionDto,
  PartialAgencyDto,
  SiretDto,
  UserId,
  WithGeoPosition,
  WithUserFilters,
  errors,
  isTruthy,
  isWithAgencyRole,
} from "shared";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import {
  AgencyRepository,
  AgencyRightWithAgencyWithUsersRights,
  AgencyWithUsersRights,
  GetAgenciesFilters,
} from "../ports/AgencyRepository";

type AgencyById = Partial<Record<AgencyId, AgencyWithUsersRights>>;

export class InMemoryAgencyRepository implements AgencyRepository {
  #agencies: AgencyById = {};

  constructor(agencyList: AgencyWithUsersRights[] = testAgencies) {
    agencyList.forEach((agency) => {
      this.#agencies[agency.id] = agency;
    });
  }

  async getAgenciesRightsByUserId(
    id: UserId,
  ): Promise<AgencyRightWithAgencyWithUsersRights[]> {
    return values(this.#agencies).reduce<
      AgencyRightWithAgencyWithUsersRights[]
    >((acc, agency) => {
      const userRights = agency?.usersRights[id];
      return [
        ...acc,
        ...(userRights
          ? [
              {
                agency,
                ...userRights,
              } satisfies AgencyRightWithAgencyWithUsersRights,
            ]
          : []),
      ];
    }, []);
  }

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
            agencyHasSiret(agency, filters?.siret),
            agencyDoesNotReferToOtherAgency(
              agency,
              filters?.doesNotReferToOtherAgency,
            ),
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

  public async getById(
    id: AgencyId,
  ): Promise<AgencyWithUsersRights | undefined> {
    return this.#agencies[id];
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
      throw errors.agencies.notFound({ agencyIds: result.missingIds });
    return result.agencies;
  }

  public async getBySafir(
    safirCode: string,
  ): Promise<AgencyWithUsersRights | undefined> {
    return values(this.#agencies)
      .filter(isTruthy)
      .find((agency) => agency.codeSafir === safirCode);
  }

  public async getImmersionFacileAgencyId(): Promise<AgencyId> {
    return "immersion-facile-agency";
  }

  public async getUserIdByFilters(filters: WithUserFilters): Promise<UserId[]> {
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

  public async insert(
    agency: AgencyWithUsersRights,
  ): Promise<AgencyId | undefined> {
    if (this.#agencies[agency.id]) return undefined;
    this.#agencies[agency.id] = agency;
    return agency.id;
  }

  public setAgencies(agencyList: AgencyWithUsersRights[]) {
    this.#agencies = {};
    agencyList.forEach((agency) => {
      this.#agencies[agency.id] = agency;
    });
  }

  public async update(agency: PartialAgencyDto) {
    const agencyToUdpate = this.#agencies[agency.id];
    if (!agencyToUdpate) {
      throw new Error(`Agency ${agency.id} does not exist`);
    }
    this.#agencies[agency.id] = { ...agencyToUdpate, ...agency };
  }
}

const sortByNearestFrom =
  (position: GeoPositionDto) =>
  (a: AgencyOption & WithGeoPosition, b: AgencyOption & WithGeoPosition) =>
    distanceBetweenCoordinatesInMeters(
      a.position.lat,
      a.position.lon,
      position.lat,
      position.lon,
    ) -
    distanceBetweenCoordinatesInMeters(
      b.position.lat,
      b.position.lon,
      position.lat,
      position.lon,
    );

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

const agencyHasSiret = (
  agency: AgencyWithUsersRights,
  siret?: SiretDto,
): boolean => {
  if (!siret) return true;
  return agency.agencySiret === siret;
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
      agency.position.lat,
      agency.position.lon,
      positionFilter.position.lat,
      positionFilter.position.lon,
    ) <
    positionFilter.distance_km * 1000
  );
};

const agency3: AgencyWithUsersRights = {
  id: "test-agency-3-back",
  name: "Test Agency 3 (back)",
  status: "active",
  agencySiret: "00000000000000",
  kind: "pole-emploi",
  usersRights: {
    validatorUserA3: { isNotifiedByEmail: true, roles: ["validator"] },
  },
  questionnaireUrl: "http://questionnaire.agency3.fr",
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
  rejectionJustification: null,
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
  questionnaireUrl: "http://questionnaire.agency1.fr",
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
  rejectionJustification: null,
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
    questionnaireUrl: null,
    codeSafir: null,
    rejectionJustification: null,
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
    questionnaireUrl: "http://questionnaire.agency2.fr",
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
    rejectionJustification: null,
    codeSafir: null,
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
    questionnaireUrl: "http://questionnaire.agency4.fr",
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
    rejectionJustification: null,
    codeSafir: null,
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
    questionnaireUrl: "http://questionnaire.agency5.fr",
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
    rejectionJustification: null,
    codeSafir: null,
  },
];
