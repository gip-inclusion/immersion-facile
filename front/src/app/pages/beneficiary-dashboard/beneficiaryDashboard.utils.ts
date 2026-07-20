import {
  type BeneficiaryDashboardTab,
  beneficiaryDashboardTabsList,
} from "shared";
import type { BeneficiaryDashboardRouteName } from "../auth/ConnectedPrivateRoutePage";

export const isBeneficiaryDashboardTab = (
  input: string,
): input is BeneficiaryDashboardTab =>
  beneficiaryDashboardTabsList.includes(input as BeneficiaryDashboardTab);

export const beneficiaryDashboardRouteNameFromTabId: Record<
  BeneficiaryDashboardTab,
  BeneficiaryDashboardRouteName
> = {
  discussions: "beneficiaryDashboardDiscussions",
  conventions: "beneficiaryDashboardConventions",
};

export const beneficiaryDashboardTabFromRouteName: Record<
  BeneficiaryDashboardRouteName,
  BeneficiaryDashboardTab
> = {
  beneficiaryDashboard: "discussions",
  beneficiaryDashboardDiscussions: "discussions",
  beneficiaryDashboardConventions: "conventions",
};
