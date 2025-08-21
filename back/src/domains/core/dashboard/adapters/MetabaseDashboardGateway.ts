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

type DashboardKind = "dashboard" | "question";

type MetabaseDashboard = {
  kind: DashboardKind;
  id: number;
};

const dashboardByName: Record<DashboardName, MetabaseDashboard> = {
  adminAgencyDetails: { kind: "dashboard", id: 4 },
  adminAgencies: { kind: "dashboard", id: 130 },
  adminConventions: { kind: "dashboard", id: 5 },
  adminEvents: { kind: "question", id: 330 },
  adminEstablishments: { kind: "dashboard", id: 115 },
  agencyForUser: { kind: "dashboard", id: 150 }, // https://metabase.immersion-facile.beta.gouv.fr/dashboard/150
  erroredConventionsForUser: { kind: "dashboard", id: 151 },
  conventionStatus: { kind: "dashboard", id: 45 },
  establishmentRepresentativeConventions: {
    kind: "dashboard",
    id: 128,
  },
  establishmentRepresentativeDiscussions: {
    kind: "dashboard",
    id: 138,
  },
  statsAgencies: { kind: "dashboard", id: 237 },
  statsEstablishmentDetails: { kind: "dashboard", id: 223 },
  statsConventionsByEstablishmentByDepartment: { kind: "dashboard", id: 224 },
};

type MetabasePayload = {
  resource: Partial<Record<DashboardKind, number>>;
  params?: Record<string, string[] | string>;
  exp: number; // number of milliseconds before expiration
};

export class MetabaseDashboardGateway implements DashboardGateway {
  constructor(
    private metabaseUrl: AbsoluteUrl,
    private metabaseApiKey: string,
  ) {}
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
    now: Date,
  ): OmitFromExistingKeys<AgencyDashboards, "erroredConventionsDashboardUrl"> {
    return {
      agencyDashboardUrl: this.#makeDashboardUrlByDashboardName(
        "agencyForUser",
        now,
        { ic_user_id: userId },
      ),
      statsEstablishmentDetailsUrl: this.#makeDashboardUrlByDashboardName(
        "statsEstablishmentDetails",
        now,
      ),
      statsConventionsByEstablishmentByDepartmentUrl:
        this.#makeDashboardUrlByDashboardName(
          "statsConventionsByEstablishmentByDepartment",
          now,
        ),
      statsAgenciesUrl: this.#makeDashboardUrlByDashboardName(
        "statsAgencies",
        now,
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

  #makeUrl(token: string, { kind }: MetabaseDashboard): AbsoluteUrl {
    return `${this.metabaseUrl}/embed/${kind}/${token}#bordered=true&titled=true`;
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

    return jwt.sign(payload, this.metabaseApiKey);
  }
}
