import {
  AgencyId,
  AgencyRight,
  Email,
  InclusionConnectedUser,
  User,
  UserId,
  WithAgencyRole,
} from "shared";
import { OAuthGatewayMode } from "./OAuthGateway";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
  email?: Email;
};

export interface UserRepository {
  delete(id: UserId): Promise<void>;
  save(user: User, mode: OAuthGatewayMode): Promise<void>;
  findByExternalId(
    externalId: string,
    mode: OAuthGatewayMode,
  ): Promise<User | undefined>;
  findByEmail(email: Email, mode: OAuthGatewayMode): Promise<User | undefined>;
  getWithFilter(
    filters: InclusionConnectedFilters,
    mode: OAuthGatewayMode,
  ): Promise<InclusionConnectedUser[]>;
  getById(
    userId: string,
    mode: OAuthGatewayMode,
  ): Promise<InclusionConnectedUser | undefined>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>;
}
