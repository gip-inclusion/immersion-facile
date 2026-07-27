import type { ConnectedUserJwt, FederatedIdentityProvider } from "shared";
import type { RootState } from "src/core-logic/storeConfig/store";

const allowedProviders: FederatedIdentityProvider[] = ["proConnect", "email"];

export const getConnectedUserJwt = ({
  auth: { federatedIdentity },
}: RootState): ConnectedUserJwt =>
  federatedIdentity && allowedProviders.includes(federatedIdentity.provider)
    ? federatedIdentity.token
    : "";
