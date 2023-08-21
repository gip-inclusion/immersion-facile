import React from "react";
import { makeStyles } from "tss-react/dsfr";
import { AddEstablishmentsByBatch } from "src/app/components/admin/establishments/AddEstablishmentsByBatch";
import { ManageEstablishment } from "src/app/components/admin/establishments/ManageEstablishment";

export const EstablishmentsTab = () => {
  const { cx } = useStyles();

  return (
    <div className={cx("admin-tab__import-establishments")}>
      <ManageEstablishment />
      <AddEstablishmentsByBatch />
    </div>
  );
};

const useStyles = makeStyles()({});
