import React from "react";
import { Notification } from "react-design-system";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";

export const ConventionTab = () => {
  const { url, error } = useAdminDashboard({ name: "conventions" });

  return error ? (
    <Notification type="error" title="Erreur" children={error} />
  ) : (
    <MetabaseView title="Conventions" url={url} />
  );
};

export const EventsTab = () => {
  const { url, error } = useAdminDashboard({ name: "events" });
  return error ? (
    <Notification type="error" title="Erreur" children={error} />
  ) : (
    <MetabaseView title="Evénements" url={url} />
  );
};
