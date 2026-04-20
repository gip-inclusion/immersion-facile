import type { UserEstablishmentRightDetailsWithAcceptedStatus } from "shared";
import { EstablishmentsRightsTable } from "./EstablishmentsRightsTable";

export const EstablishmentsTablesSection = ({
  withEstablishmentData,
  isBackofficeAdmin,
}: {
  withEstablishmentData?: UserEstablishmentRightDetailsWithAcceptedStatus[];
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
