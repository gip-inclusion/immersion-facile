import jwt from "jsonwebtoken";
import type {
  AbsoluteUrl,
  AgencyId,
  ConventionId,
  DashboardName,
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

  public getAgencyUserUrl(userId: UserId, now: Date): AbsoluteUrl {
    const dashboard = dashboardByName.agencyForUser;
    const token = this.#createToken({
      dashboard,
      params: { ic_user_id: userId },
      now,
    });
    return this.#makeUrl(token, dashboard);
  }

  public getConventionStatusUrl(id: ConventionId, now: Date): AbsoluteUrl {
    const dashboard = dashboardByName.conventionStatus;
    const token = this.#createToken({
      dashboard,
      params: { id: [id] },
      now,
    });
    return this.#makeUrl(token, dashboard);
  }

  public getDashboardUrl(dashboardName: DashboardName, now: Date): AbsoluteUrl {
    const dashboard = dashboardByName[dashboardName];
    const token = this.#createToken({
      dashboard,
      now,
    });
    return this.#makeUrl(token, dashboard);
  }

  public getErroredConventionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl {
    const dashboard = dashboardByName.erroredConventionsForUser;
    const token = this.#createToken({
      dashboard,
      params: { ic_user_id: userId },
      now,
    });
    return this.#makeUrl(token, dashboard);
  }

  public getEstablishmentConventionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl {
    const dashboard = dashboardByName.establishmentRepresentativeConventions;
    const token = this.#createToken({
      dashboard,
      params: {
        ic_user_id: userId,
      },
      now,
    });
    return this.#makeUrl(token, dashboard);
  }

  public getEstablishmentDiscussionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl {
    const dashboard = dashboardByName.establishmentRepresentativeDiscussions;
    const token = this.#createToken({
      dashboard,
      params: {
        ic_user_id: userId,
      },
      now,
    });
    return this.#makeUrl(token, dashboard);
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
