export const oAuthGatewayProviders = ["proConnect"] as const;
export type OAuthGatewayProvider = (typeof oAuthGatewayProviders)[number];
