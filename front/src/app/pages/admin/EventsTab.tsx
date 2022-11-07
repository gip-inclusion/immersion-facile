import React from "react";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useDashboard } from "src/app/pages/admin/UseDashboard";

export const EventsTab = () => {
  const eventsDashboardUrl = useDashboard("events");
  return <MetabaseView title="Évenements" url={eventsDashboardUrl} />;
};
