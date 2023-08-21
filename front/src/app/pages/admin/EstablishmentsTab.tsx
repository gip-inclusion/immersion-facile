import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { makeStyles } from "tss-react/dsfr";
import { AddEstablishmentsByBatch } from "src/app/components/admin/establishments/AddEstablishmentsByBatch";
import { ManageEstablishment } from "src/app/components/admin/establishments/ManageEstablishment";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAdminDashboard } from "./useAdminDashboard";

export const EstablishmentsTab = () => {
  const { url, error } = useAdminDashboard({ name: "establishments" });
  const { cx } = useStyles();

  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <div className={cx("admin-tab__import-establishments")}>
      <ManageEstablishment />
      <MetabaseView title="Consulter les établissements" url={url} />
      <AddEstablishmentsByBatch />
    </div>
  );
};

const useStyles = makeStyles()({});
