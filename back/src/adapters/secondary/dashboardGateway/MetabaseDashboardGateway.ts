import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import jwt from "jsonwebtoken";
import { AgencyId } from "shared/src/agency/agency.dto";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";

// These are t
const dashboardIds = {
  agencyDashboardId: 4,
  conventionsDashboardId: 5,
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
      dashboardId: dashboardIds.agencyDashboardId,
      params: { filtrer_par_structure: [id] },
    });
    return `${this.metabaseUrl}/embed/dashboard/${token}#bordered=true&titled=true`;
  }

  public getConventionsUrl(): AbsoluteUrl {
    const token = this.createToken({
      dashboardId: dashboardIds.conventionsDashboardId,
    });
    return `${this.metabaseUrl}/embed/dashboard/${token}#bordered=true&titled=true?filter=true`;
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
