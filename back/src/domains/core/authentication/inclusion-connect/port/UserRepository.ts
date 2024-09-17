import {
  AgencyId,
  AgencyRight,
  Email,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  User,
  UserId,
  WithAgencyRole,
} from "shared";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
  email?: Email;
};

export interface UserRepository {
  delete(id: UserId): Promise<void>;
  save(user: User, provider: OAuthGatewayProvider): Promise<void>;
  findByExternalId(
    externalId: string,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined>;
  findByEmail(
    email: Email,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined>;
  getWithFilter(
    filters: InclusionConnectedFilters,
    provider: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser[]>;
  getById(
    userId: string,
    provider: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser | undefined>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>;
}
