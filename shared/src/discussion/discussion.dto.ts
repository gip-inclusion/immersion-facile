import { Flavor } from "../typeFlavors";
import { includesTypeGuard } from "../typeGuard";

const exchangeRoles = ["establishment", "potentialBeneficiary"] as const;
export type ExchangeRole = (typeof exchangeRoles)[number];
export const isExchangeRole = includesTypeGuard(exchangeRoles);

export type DiscussionId = Flavor<string, "DiscussionId">;
