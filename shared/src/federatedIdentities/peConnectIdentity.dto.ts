import { Flavor } from "../typeFlavors";
import { FederatedIdentity } from "./federatedIdentity.dto";

const peConnectPrefix = "peConnect:";
type PeConnectPrefix = typeof peConnectPrefix;
export type PeConnectIdentity = `${PeConnectPrefix}${
  | PeExternalId
  | "AuthFailed"}`;
export const isPeConnectIdentity = (
  federatedIdentity: FederatedIdentity,
): federatedIdentity is PeConnectIdentity =>
  federatedIdentity.startsWith(peConnectPrefix);

export type PeExternalId = Flavor<string, "PeExternalId">;
export const toPeExternalId = (
  federatedIdentity: PeConnectIdentity,
): PeExternalId => federatedIdentity.substring(peConnectPrefix.length);

export const peConnectAuthFailed: PeConnectIdentity = `${peConnectPrefix}AuthFailed`;
