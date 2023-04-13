import { values } from "ramda";
import {
  AgencyDto,
  AgencyId,
  AgencyKindFilter,
  AgencyOption,
  AgencyPositionFilter,
  AgencyStatus,
  DepartmentCode,
  GeoPositionDto,
  GetAgenciesFilter as GetAgenciesFilters,
  PartialAgencyDto,
  WithGeoPosition,
} from "shared";
import { AgencyRepository } from "../../domain/convention/ports/AgencyRepository";
import { distanceBetweenCoordinatesInMeters } from "../../utils/distanceBetweenCoordinatesInMeters";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

const testAgencies: AgencyDto[] = [
  {
    id: "immersion-facile-agency",
    name: "Immersion Facile Agency (back)",
    status: "active",
    kind: "immersion-facile",
    counsellorEmails: ["notificationsconventions@immersion-facile.fr"],
    validatorEmails: [],
    adminEmails: ["contact@immersion-facile.fr"],
    questionnaireUrl: "",
    signature: "Signature of Immersion Facile",
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
  },
  {
    id: "test-agency-2-back",
    name: "Test Agency 2 (back)",
    status: "active",
    kind: "mission-locale",
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
  },
  {
    id: "test-agency-3-back",
    name: "Test Agency 3 (back)",
    status: "active",
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
  },
];

export class InMemoryAgencyRepository implements AgencyRepository {
  constructor(agencyList: AgencyDto[] = testAgencies) {
    agencyList.forEach((agency) => {
      this._agencies[agency.id] = agency;
    });
    logger.info(this._agencies);
  }

  public async getById(id: AgencyId): Promise<AgencyDto | undefined> {
    logger.info({ id, configs: this._agencies }, "getById");
    return this._agencies[id];
  }

  public async getAgencies({
    filters = {},
    limit,
  }: {
    filters?: GetAgenciesFilters;
    limit?: number;
  }): Promise<AgencyDto[]> {
    logger.info({ configs: this._agencies }, "getAgencies");
    const filterPredicate = (agency: AgencyDto) =>
      ![
        agencyHasDepartmentCode(agency, filters?.departmentCode),
        agencyHasName(agency, filters?.nameIncludes),
        agencyIsOfKind(agency, filters?.kind),
        agencyIsOfPosition(agency, filters?.position),
        agencyIsOfStatus(agency, filters?.status),
      ].includes(false);

    const filteredAgencies = Object.values(this._agencies)
      .filter(filterPredicate)
      .slice(0, limit);
    if (!filters?.position) return filteredAgencies;
    return filteredAgencies.sort(sortByNearestFrom(filters.position.position));
  }

  public async getAgencyWhereEmailMatches(
    email: string,
  ): Promise<AgencyDto | undefined> {
    return Object.values(this._agencies).filter(
      (agency) =>
        agency.validatorEmails.includes(email) ||
        agency.counsellorEmails.includes(email),
    )[0];
  }

  public async insert(config: AgencyDto): Promise<AgencyId | undefined> {
    logger.info({ config, configs: this._agencies }, "insert");
    if (this._agencies[config.id]) return undefined;
    this._agencies[config.id] = config;
    return config.id;
  }

  public async update(agency: PartialAgencyDto) {
    if (!this._agencies[agency.id]) {
      throw new Error(`Agency ${agency.id} does not exist`);
    }
    this._agencies[agency.id] = { ...this._agencies[agency.id], ...agency };
  }

  public async getImmersionFacileAgencyId(): Promise<AgencyId> {
    return "immersion-facile-agency";
  }

  // test purpose only
  get agencies(): AgencyDto[] {
    return values(this._agencies);
  }

  setAgencies(agencyList: AgencyDto[]) {
    this._agencies = {};
    agencyList.forEach((agency) => {
      this._agencies[agency.id] = agency;
    });
  }

  private _agencies: { [id: string]: AgencyDto } = {};
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
