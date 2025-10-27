import type { EstablishmentData } from "shared";
import { EstablishmentsRightsTable } from "./EstablishmentsRightsTable";

export const EstablishmentsTablesSection = ({
  withEstablishmentData,
  isBackofficeAdmin,
}: {
  withEstablishmentData?: EstablishmentData[];
  isBackofficeAdmin?: boolean;
}) => (
  <>
    {withEstablishmentData && withEstablishmentData.length > 0 && (
      <EstablishmentsRightsTable
        withEstablishmentData={withEstablishmentData}
        isBackofficeAdmin={isBackofficeAdmin}
      />
    )}
  </>
);
