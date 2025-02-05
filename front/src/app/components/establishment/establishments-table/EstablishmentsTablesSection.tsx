import { WithEstablishmentData } from "shared";
import { EstablishmentsRightsTable } from "./EstablishmentsRightsTable";

export const EstablishmentsTablesSection = ({
  withEstablishmentData,
}: {
  withEstablishmentData?: WithEstablishmentData[];
}) => (
  <>
    {withEstablishmentData && withEstablishmentData.length > 0 && (
      <EstablishmentsRightsTable
        withEstablishmentData={withEstablishmentData}
      />
    )}
  </>
);
