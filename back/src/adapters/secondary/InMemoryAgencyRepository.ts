import { AgencyRepository } from "../../domain/convention/ports/AgencyRepository";
import {
  AgencyInListDto,
  AgencyId,
  AgencyStatus,
  AgencyKindFilter,
} from "shared/src/agency/agency.dto";
import { createLogger } from "../../utils/logger";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { values } from "ramda";
import { distanceBetweenCoordinatesInMeters } from "../../utils/distanceBetweenCoordinatesInMeters";
import { LatLonDto } from "shared/src/latLon";

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
    address: "No address",
    position: {
      lat: 22.319469,
      lon: 114.189505,
    },
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
    address: "Agency 1 address",
    position: {
      lat: 1,
      lon: 2,
    },
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
    address: "Agency 2 address",
    position: {
      lat: 40,
      lon: 50,
    },
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
    address: "Agency 3 address",
    position: {
      lat: 88,
      lon: 89.9999,
    },
  },
];

export class InMemoryAgencyRepository implements AgencyRepository {
  private _agencies: { [id: string]: AgencyDto } = {};

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

  public async getAllActiveNearby(
    position: LatLonDto,
    _distance_km: number,
    agencyKindFilter?: AgencyKindFilter,
  ): Promise<AgencyDto[]> {
    logger.info({ position, configs: this._agencies }, "getAllActiveNearby");
    const activeAgenciesNearby = Object.values(this._agencies)
      .filter(isAgencyActive)
      .sort(sortByNearestFrom(position))
      .slice(0, 20);
    return filterAgenciesByKind(activeAgenciesNearby, agencyKindFilter);
  }

  public async getAllActive(
    agencyKindFilter?: AgencyKindFilter,
  ): Promise<AgencyDto[]> {
    logger.info({ configs: this._agencies }, "getAll");
    const activeAgencies = Object.values(this._agencies).filter(isAgencyActive);
    return filterAgenciesByKind(activeAgencies, agencyKindFilter);
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

  public async update(agency: AgencyDto) {
    if (!this._agencies[agency.id]) {
      throw new Error(`Agency ${agency.id} does not exist`);
    }
    this._agencies[agency.id] = agency;
  }

  public async getImmersionFacileIdByKind(): Promise<AgencyId> {
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
}

const activeStatuses: AgencyStatus[] = ["active", "from-api-PE"];

const isAgencyActive = (agency: AgencyDto) =>
  activeStatuses.includes(agency.status);

const isAgencyPE = (agency: AgencyDto) => agency.kind === "pole-emploi";

const isAgencyNotPE = (agency: AgencyDto) => agency.kind !== "pole-emploi";

const sortByNearestFrom =
  (position: LatLonDto) => (a: AgencyInListDto, b: AgencyInListDto) =>
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

const filterAgenciesByKind = (
  agencies: AgencyDto[],
  agencyKindFilter?: AgencyKindFilter,
) => {
  if (!agencyKindFilter) return agencies;
  return agencyKindFilter === "peOnly"
    ? agencies.filter(isAgencyPE)
    : agencies.filter(isAgencyNotPE);
};
