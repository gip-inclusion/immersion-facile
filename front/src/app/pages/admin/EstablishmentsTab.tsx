import Alert from "@codegouvfr/react-dsfr/Alert";
import { AddEstablishmentsByBatch } from "src/app/components/admin/establishments/AddEstablishmentsByBatch";
import { ManageEstablishment } from "src/app/components/admin/establishments/ManageEstablishment";
import { MetabaseView } from "src/app/components/MetabaseView";
import { makeStyles } from "tss-react/dsfr";
import { useAdminDashboard } from "./useAdminDashboard";

export const EstablishmentsTab = () => {
  const { url, error } = useAdminDashboard({ name: "adminEstablishments" });
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
