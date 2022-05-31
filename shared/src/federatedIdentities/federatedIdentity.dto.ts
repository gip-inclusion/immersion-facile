import { Flavor } from "../typeFlavors";

export type FederatedIdentity = PeConnectIdentity;

export type PeExternalId = Flavor<string, "peExternalId">;

type PeConnectPrefix = "peConnect:";

export type PeConnectIdentity = `${PeConnectPrefix}${string}`;

export const toPeExternalId = (
  federatedIdentity: PeConnectIdentity,
): PeExternalId => federatedIdentity.substring("peConnect:".length);
