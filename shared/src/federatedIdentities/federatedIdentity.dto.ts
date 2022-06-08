import { Flavor } from "../typeFlavors";

export type FederatedIdentity = PeConnectIdentity | NoIdentityProvider;

export type PeExternalId = Flavor<string, "PeExternalId">;

export type PeConnectIdentity = `peConnect:${string}`;
type NoIdentityProvider = `noIdentityProvider`;

export const toPeExternalId = (
  federatedIdentity: PeConnectIdentity,
): PeExternalId => federatedIdentity.substring("peConnect:".length);
