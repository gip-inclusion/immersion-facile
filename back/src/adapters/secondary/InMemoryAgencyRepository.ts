import { values } from "ramda";
import {
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  AgencyKindFilter,
  AgencyOption,
  AgencyPositionFilter,
  AgencyStatus,
  DepartmentCode,
  GeoPositionDto,
  GetAgenciesFilter as GetAgenciesFilters,
  isTruthy,
  PartialAgencyDto,
  WithGeoPosition,
} from "shared";
import {
  AgencyRepository,
  someAgenciesMissingMessage,
} from "../../domain/convention/ports/AgencyRepository";
import { distanceBetweenCoordinatesInMeters } from "../../utils/distanceBetweenCoordinatesInMeters";
import { NotFoundError } from "../primary/helpers/httpErrors";

const testAgencies: AgencyDto[] = [
  {
    id: "immersion-facile-agency",
    name: "Immersion Facile Agency (back)",
    status: "active",
    kind: "immersion-facile",
    counsellorEmails: ["notificationsconventions@immersion-facile.fr"],
    validatorEmails: ["validator123@mail.com"],
    adminEmails: ["contact@immersion-facile.fr"],
    signature: "Signature of Immersion Facile",
    agencySiret: "00000000000000",
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
    refersToAgencyId: undefined,
  },
  {
    id: "test-agency-1-back",
    name: "Test Agency 1 (back)",
    status: "active",
    kind: "pole-emploi",
    counsellorEmails: ["counsellor@agency1.fr"],
    validatorEmails: ["validator@agency1.fr"],
    adminEmails: ["admin@agency1.fr"],
    questionnaireUrl: "http://questionnaire.agency1.fr",
    signature: "Signature of Test Agency 1",
    agencySiret: "00000000000000",
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
    refersToAgencyId: undefined,
  },
  {
    id: "test-agency-2-back",
    name: "Test Agency 2 (back)",
    status: "active",
    kind: "mission-locale",
    agencySiret: "00000000000000",
    counsellorEmails: ["counsellor1@agency2.fr", "counsellor2@agency2.fr"],
    validatorEmails: ["validator1@agency2.fr", "validator2@agency2.fr"],
    adminEmails: ["admin1@agency2.fr", "admin2@agency2.fr"],
    questionnaireUrl: "http://questionnaire.agency2.fr",
    signature: "Signature of Test Agency 2",
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
    refersToAgencyId: undefined,
  },
  {
    id: "test-agency-3-back",
    name: "Test Agency 3 (back)",
    status: "active",
    agencySiret: "00000000000000",
    kind: "pole-emploi",
    counsellorEmails: [], // no counsellors
    validatorEmails: ["validator@agency3.fr"],
    adminEmails: ["admin@agency3.fr"],
    questionnaireUrl: "http://questionnaire.agency3.fr",
    signature: "Signature of Test Agency 3",
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
    refersToAgencyId: undefined,
  },
  {
    id: "test-agency-4-back-with-refers-to",
    name: "Test Agency 4 (back) - refers to Test Agency 3",
    status: "active",
    agencySiret: "00000000000000",
    kind: "autre",
    counsellorEmails: ["counsellor@agency4.fr"], // no counsellors
    validatorEmails: ["validator@agency3.fr"],
    adminEmails: [],
    questionnaireUrl: "http://questionnaire.agency4.fr",
    signature: "Signature of Test Agency 4 accompagnante",
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
    refersToAgencyId: "test-agency-3-back",
  },
  {
    id: "test-agency-5-back-with-refers-to",
    name: "Test Agency 5 (back) - refers to Test Agency 1",
    status: "active",
    agencySiret: "00000000000000",
    kind: "autre",
    counsellorEmails: ["counsellor@agency5.fr"], // no counsellors
    validatorEmails: ["validator@agency1.fr"],
    adminEmails: [],
    questionnaireUrl: "http://questionnaire.agency5.fr",
    signature: "Signature of Test Agency 5 accompagnante",
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
    refersToAgencyId: "test-agency-1-back",
  },
];

export class InMemoryAgencyRepository implements AgencyRepository {
  #agencies: Partial<{ [id: string]: AgencyDto }> = {};

  constructor(agencyList: AgencyDto[] = testAgencies) {
    agencyList.forEach((agency) => {
      this.#agencies[agency.id] = agency;
    });
  }

  // test purpose only
  public get agencies(): AgencyDto[] {
    return values(this.#agencies).filter(isTruthy);
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
  }): Promise<AgencyDto[]> {
    const filteredAgencies = Object.values(this.#agencies)
      .filter(isTruthy)
      .filter(
        (agency) =>
          ![
            agencyHasDepartmentCode(agency, filters?.departmentCode),
            agencyHasName(agency, filters?.nameIncludes),
            agencyIsOfKind(agency, filters?.kind),
            agencyIsOfPosition(agency, filters?.position),
            agencyIsOfStatus(agency, filters?.status),
          ].includes(false),
      )
      .slice(0, limit);

    return filters?.position
      ? filteredAgencies.sort(sortByNearestFrom(filters.position.position))
      : filteredAgencies;
  }

  public async getAgenciesRelatedToAgency(id: AgencyId): Promise<AgencyDto[]> {
    return values(this.#agencies)
      .filter(isTruthy)
      .filter((agency) => agency.refersToAgencyId === id);
  }

  public async getAgencyWhereEmailMatches(
    email: string,
  ): Promise<AgencyDto | undefined> {
    return values(this.#agencies)
      .filter(isTruthy)
      .find(
        (agency) =>
          agency.validatorEmails.includes(email) ||
          agency.counsellorEmails.includes(email),
      );
  }

  public async getById(id: AgencyId): Promise<AgencyDto | undefined> {
    return this.#agencies[id];
  }

  public async getByIds(ids: AgencyId[]): Promise<AgencyDto[]> {
    const result = ids.reduce<{
      agencies: AgencyDto[];
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
      throw new NotFoundError(someAgenciesMissingMessage(result.missingIds));
    return result.agencies;
  }

  public async getBySafir(safirCode: string): Promise<AgencyDto | undefined> {
    return values(this.#agencies)
      .filter(isTruthy)
      .find((agency) => agency.codeSafir === safirCode);
  }

  public async getImmersionFacileAgencyId(): Promise<AgencyId> {
    return "immersion-facile-agency";
  }

  public async insert(agency: AgencyDto): Promise<AgencyId | undefined> {
    if (this.#agencies[agency.id]) return undefined;
    this.#agencies[agency.id] = agency;
    return agency.id;
  }

  public setAgencies(agencyList: AgencyDto[]) {
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

const isImmersionPeOnly = (agency: AgencyDto) => agency.kind === "pole-emploi";
const isAgencyCci = (agency: AgencyDto) => agency.kind === "cci";

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
  agency: AgencyDto,
  agencyKindFilter?: AgencyKindFilter,
): boolean => {
  if (agencyKindFilter === "immersionPeOnly") return isImmersionPeOnly(agency);
  if (agencyKindFilter === "immersionWithoutPe")
    return !isAgencyCci(agency) && !isImmersionPeOnly(agency);
  if (agencyKindFilter === "miniStageOnly") return isAgencyCci(agency);
  if (agencyKindFilter === "miniStageExcluded") return !isAgencyCci(agency);
  if (agencyKindFilter === "withoutRefersToAgency")
    return !agency.refersToAgencyId;
  return true;
};

const agencyIsOfStatus = (
  agency: AgencyDto,
  statuses?: AgencyStatus[],
): boolean => {
  if (!statuses) return true;
  return statuses.includes(agency.status);
};

const agencyHasDepartmentCode = (
  agency: AgencyDto,
  departmentCode?: DepartmentCode,
): boolean => {
  if (!departmentCode) return true;
  return departmentCode === agency.address.departmentCode;
};

const agencyHasName = (agency: AgencyDto, name?: string): boolean => {
  if (!name) return true;
  return agency.name.toLowerCase().includes(name.toLowerCase());
};

const agencyIsOfPosition = (
  agency: AgencyDto,
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
