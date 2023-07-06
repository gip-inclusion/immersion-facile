import React from "react";
import { makeStyles } from "tss-react/dsfr";
import { AddEstablishmentsByBatch } from "src/app/components/establishments/AddEstablishmentsByBatch";

export const EstablishmentsTab = () => {
  const { cx } = useStyles();

  return (
    <div className={cx("admin-tab__import-establishments")}>
      <AddEstablishmentsByBatch />
    </div>
  );
};

const useStyles = makeStyles()({});
