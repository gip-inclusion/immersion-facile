import type { EstablishmentData } from "shared";
import { EstablishmentsRightsTable } from "./EstablishmentsRightsTable";

export const EstablishmentsTablesSection = ({
  withEstablishmentData,
}: {
  withEstablishmentData?: EstablishmentData[];
}) => (
  <>
    {withEstablishmentData && withEstablishmentData.length > 0 && (
      <EstablishmentsRightsTable
        withEstablishmentData={withEstablishmentData}
      />
    )}
  </>
);
