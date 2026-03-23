import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { domElementIds, type EstablishmentData } from "shared";
import { routes } from "src/app/routes/routes";
import { EstablishmentsRightsTable } from "./EstablishmentsRightsTable";

export const EstablishmentsTablesSection = ({
  withEstablishmentData,
  isBackofficeAdmin,
}: {
  withEstablishmentData?: EstablishmentData[];
  isBackofficeAdmin?: boolean;
}) => (
  <>
    <div className={fr.cx("fr-grid-row")}>
      <Button
        id={domElementIds.profile.registerEstablishmentButton}
        priority="primary"
        linkProps={{
          href: `${routes.myProfileEstablishmentRegistration().href}`,
        }}
        className={fr.cx("fr-ml-auto")}
        iconId="fr-icon-add-line"
      >
        Se rattacher à une entreprise
      </Button>
    </div>

    {withEstablishmentData && withEstablishmentData.length > 0 && (
      <EstablishmentsRightsTable
        withEstablishmentData={withEstablishmentData}
        isBackofficeAdmin={isBackofficeAdmin}
      />
    )}
  </>
);
