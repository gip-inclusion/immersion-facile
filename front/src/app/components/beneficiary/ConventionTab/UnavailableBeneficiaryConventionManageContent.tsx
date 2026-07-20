import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { type ConventionId, frontRoutes } from "shared";

export const UnavailableBeneficiaryConventionManageContent = ({
  conventionId,
}: {
  conventionId: ConventionId;
}): React.ReactNode => {
  return (
    <div>
      <h1>Pilotage de convention</h1>

      <p>
        Convention : <strong>{conventionId}</strong>
      </p>

      <Alert
        severity="error"
        title={"Pilotage de la convention "}
        description="Cet espace n'est pas encore accessible."
        closable={false}
      />

      <Button
        className={fr.cx("fr-mt-2w")}
        onClick={() => frontRoutes.beneficiaryDashboardConventions().push()}
      >
        Retour au listing des conventions
      </Button>
    </div>
  );
};
