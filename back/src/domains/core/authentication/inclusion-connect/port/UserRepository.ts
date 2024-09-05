import {
  AgencyId,
  AgencyRight,
  Email,
  InclusionConnectedUser,
  User,
  UserId,
  WithAgencyRole,
} from "shared";
import { OAuthGatewayProvider } from "./OAuthGateway";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
  email?: Email;
};

export interface UserRepository {
  delete(id: UserId): Promise<void>;
  save(user: User, mode: OAuthGatewayProvider): Promise<void>;
  findByExternalId(
    externalId: string,
    mode: OAuthGatewayProvider,
  ): Promise<User | undefined>;
  findByEmail(
    email: Email,
    mode: OAuthGatewayProvider,
  ): Promise<User | undefined>;
  getWithFilter(
    filters: InclusionConnectedFilters,
    mode: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser[]>;
  getById(
    userId: string,
    mode: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser | undefined>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>;
}
