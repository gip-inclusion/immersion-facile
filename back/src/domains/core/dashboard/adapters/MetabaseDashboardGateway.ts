import jwt from "jsonwebtoken";
import type {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyDashboards,
  AgencyId,
  ConventionId,
  DashboardName,
  OmitFromExistingKeys,
  UserId,
} from "shared";
import type { DashboardGateway } from "../port/DashboardGateway";

type MetabaseEndpoint = "v1" | "v2";

type MetabaseEndpointConfig = {
  url: AbsoluteUrl;
  apiKey: string;
};

export type MetabaseConfig = Record<MetabaseEndpoint, MetabaseEndpointConfig>;

type DashboardKind = "dashboard" | "question";

type MetabaseDashboard = {
  endpoint: MetabaseEndpoint;
  kind: DashboardKind;
  id: number;
};

const dashboardByName: Record<DashboardName, MetabaseDashboard> = {
  adminAgencyDetails: { kind: "dashboard", id: 4, endpoint: "v1" },
  adminAgencies: { kind: "dashboard", id: 130, endpoint: "v1" },
  adminConventions: { kind: "dashboard", id: 5, endpoint: "v1" },
  adminEvents: { kind: "question", id: 330, endpoint: "v1" },
  adminEstablishments: { kind: "dashboard", id: 115, endpoint: "v1" },
  agencyForUser: { kind: "dashboard", id: 150, endpoint: "v1" }, // https://metabase.immersion-facile.beta.gouv.fr/dashboard/150
  erroredConventionsForUser: {
    kind: "dashboard",
    id: 151,
    endpoint: "v1",
  },
  conventionStatus: { kind: "dashboard", id: 45, endpoint: "v1" },
  establishmentRepresentativeConventions: {
    kind: "dashboard",
    id: 128,
    endpoint: "v1",
  },
  establishmentRepresentativeDiscussions: {
    kind: "dashboard",
    id: 138,
    endpoint: "v1",
  },
  agencyManagement: { kind: "dashboard", id: 2, endpoint: "v2" },
  establishmentManagement: { kind: "dashboard", id: 13, endpoint: "v2" },
};

type MetabasePayload = {
  resource: Partial<Record<DashboardKind, number>>;
  params?: Record<string, string[] | string>;
  exp: number; // number of milliseconds before expiration
};

export class MetabaseDashboardGateway implements DashboardGateway {
  constructor(private metabaseConfig: MetabaseConfig) {}

  public getAgencyForAdminUrl(agencyId: AgencyId, now: Date): AbsoluteUrl {
    const dashboard = dashboardByName.adminAgencyDetails;
    const token = this.#createToken({
      dashboard,
      params: { filtrer_par_structure: [agencyId] },
      now,
    });
    return this.#makeUrl(token, dashboard);
  }

  #makeDashboardUrlByDashboardName(
    dashboardName: DashboardName,
    now: Date,
    params?: Record<string, string | string[]>,
  ) {
    const dashboard = dashboardByName[dashboardName];
    return this.#makeUrl(
      this.#createToken({
        dashboard,
        params,
        now,
      }),
      dashboard,
    );
  }

  public getAgencyUserUrls(
    userId: UserId,
    agencyNames: string[],
    now: Date,
  ): OmitFromExistingKeys<AgencyDashboards, "erroredConventionsDashboardUrl"> {
    return {
      agencyDashboardUrl: this.#makeDashboardUrlByDashboardName(
        "agencyForUser",
        now,
        { ic_user_id: userId },
      ),
      agencyManagement: this.#makeDashboardUrlByDashboardName(
        "agencyManagement",
        now,
        { structure: agencyNames },
      ),
      establishmentManagement: this.#makeDashboardUrlByDashboardName(
        "establishmentManagement",
        now,
        {},
      ),
    };
  }

  public getConventionStatusUrl(id: ConventionId, now: Date): AbsoluteUrl {
    return this.#makeDashboardUrlByDashboardName("conventionStatus", now, {
      id: [id],
    });
  }

  public getAdminDashboardUrl(
    dashboardName: AdminDashboardName,
    now: Date,
  ): AbsoluteUrl {
    return this.#makeDashboardUrlByDashboardName(dashboardName, now);
  }

  public getErroredConventionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl {
    return this.#makeDashboardUrlByDashboardName(
      "erroredConventionsForUser",
      now,
      { ic_user_id: userId },
    );
  }

  public getEstablishmentConventionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl {
    return this.#makeDashboardUrlByDashboardName(
      "establishmentRepresentativeConventions",
      now,
      { ic_user_id: userId },
    );
  }

  public getEstablishmentDiscussionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl {
    return this.#makeDashboardUrlByDashboardName(
      "establishmentRepresentativeDiscussions",
      now,
      { ic_user_id: userId },
    );
  }

  #makeUrl(token: string, { kind, endpoint }: MetabaseDashboard): AbsoluteUrl {
    return `${this.metabaseConfig[endpoint].url}/embed/${kind}/${token}#bordered=true&titled=true`;
  }

  #createToken({
    dashboard,
    params = {},
    now,
  }: {
    dashboard: MetabaseDashboard;
    params?: Record<string, string | string[]>;
    now: Date;
  }): string {
    const payload: MetabasePayload = {
      resource: { [dashboard.kind]: dashboard.id },
      params,
      exp: Math.round(now.getTime() / 1000) + 60 * 60 * 8, // 8 hours expiration
    };

    return jwt.sign(payload, this.metabaseConfig[dashboard.endpoint].apiKey);
  }
}
