import jwt from "jsonwebtoken";
import { AbsoluteUrl, AgencyId, DashboardName } from "shared";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";

type DashboardKind = "dashboard" | "question";

type MetabaseDashboard = {
  kind: DashboardKind;
  id: number;
};

const dashboardByName: Record<DashboardName, MetabaseDashboard> = {
  agency: { kind: "dashboard", id: 4 },
  conventions: { kind: "dashboard", id: 5 },
  events: { kind: "question", id: 330 },
};

type MetabasePayload = {
  resource: Partial<Record<DashboardKind, number>>;
  params?: Record<string, string[]>;
  exp: number; // number of milliseconds before expiration
};

export class MetabaseDashboardGateway implements DashboardGateway {
  constructor(
    private metabaseUrl: AbsoluteUrl,
    private metabaseApiKey: string,
  ) {}

  public getAgencyUrl(agencyId: AgencyId): AbsoluteUrl {
    const dashboard = dashboardByName.agency;
    const token = this.createToken({
      dashboard,
      params: { filtrer_par_structure: [agencyId] },
    });
    return this.makeUrl(token, dashboard);
  }

  public getDashboardUrl(dashboardName: DashboardName): AbsoluteUrl {
    const dashboard = dashboardByName[dashboardName];
    const token = this.createToken({
      dashboard,
    });
    return this.makeUrl(token, dashboard);
  }

  private makeUrl(token: string, { kind }: MetabaseDashboard): AbsoluteUrl {
    return `${this.metabaseUrl}/embed/${kind}/${token}#bordered=true&titled=true`;
  }

  private createToken({
    dashboard,
    params = {},
  }: {
    dashboard: MetabaseDashboard;
    params?: Record<string, string[]>;
  }): string {
    const payload: MetabasePayload = {
      resource: { [dashboard.kind]: dashboard.id },
      params,
      exp: Math.round(Date.now() / 1000) + 60 * 30, // 30 minute expiration
    };

    return jwt.sign(payload, this.metabaseApiKey);
  }
}
