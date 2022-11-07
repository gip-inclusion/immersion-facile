import jwt from "jsonwebtoken";
import { AbsoluteUrl, AgencyId, DashboardName } from "shared";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";

const dashboardIdByName: Record<DashboardName, number> = {
  agency: 4,
  conventions: 5,
  events: 28,
};

type MetabasePayload = {
  resource: {
    dashboard: number;
  };
  params?: Record<string, string[]>;
  exp: number; // number of milliseconds before expiration
};

export class MetabaseDashboardGateway implements DashboardGateway {
  constructor(
    private metabaseUrl: AbsoluteUrl,
    private metabaseApiKey: string,
  ) {}

  public getAgencyUrl(id: AgencyId): AbsoluteUrl {
    const token = this.createToken({
      dashboardId: dashboardIdByName.agency,
      params: { filtrer_par_structure: [id] },
    });
    return `${this.metabaseUrl}/embed/dashboard/${token}#bordered=true&titled=true`;
  }

  public getDashboardUrl(dashboardName: DashboardName): AbsoluteUrl {
    const token = this.createToken({
      dashboardId: dashboardIdByName[dashboardName],
    });
    return `${this.metabaseUrl}/embed/dashboard/${token}#bordered=true&titled=true`;
  }

  private createToken({
    dashboardId,
    params = {},
  }: {
    dashboardId: number;
    params?: Record<string, string[]>;
  }): string {
    const payload: MetabasePayload = {
      resource: { dashboard: dashboardId },
      params,
      exp: Math.round(Date.now() / 1000) + 60 * 30, // 30 minute expiration
    };

    return jwt.sign(payload, this.metabaseApiKey);
  }
}
