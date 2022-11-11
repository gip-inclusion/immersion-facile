import React from "react";
import { Notification } from "react-design-system";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useDashboard } from "src/app/pages/admin/useDashboard";

export const ConventionTab = () => {
  const { url, error } = useDashboard({ name: "conventions" });

  return error ? (
    <Notification type="error" title="Erreur" children={error} />
  ) : (
    <MetabaseView title="Conventions" url={url} />
  );
};

export const EventsTab = () => {
  const { url, error } = useDashboard({ name: "events" });
  return error ? (
    <Notification type="error" title="Erreur" children={error} />
  ) : (
    <MetabaseView title="Evénements" url={url} />
  );
};
