import type { TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import type { ReactNode } from "react";

export type DashboardTab = TabsProps.Controlled["tabs"][number] & {
  content: ReactNode;
};
