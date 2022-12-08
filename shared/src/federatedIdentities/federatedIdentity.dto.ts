import { NoIdentityProvider } from "./noIdentityProvider.dto";
import { PeConnectIdentity } from "./peConnectIdentity.dto";

export type FederatedIdentity = PeConnectIdentity | NoIdentityProvider;
