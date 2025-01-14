import { fr } from "@codegouvfr/react-dsfr";
import { AgencyRight } from "shared";
import { commonIllustrations } from "src/assets/img/illustrations";
import { OnGoingAgencyRightsTable } from "../agencies-table/OnGoingAgencyRightsTable";

export function NoActiveAgencyRights({
  toReviewAgencyRights,
}: {
  toReviewAgencyRights: AgencyRight[];
}): JSX.Element {
  return (
    <>
      <h2>Suivi de mes demandes</h2>
      <div className={fr.cx("fr-grid-row")}>
        <div
          className={fr.cx(
            "fr-hidden",
            "fr-unhidden-lg",
            "fr-col-2",
            "fr-pr-2w",
          )}
        >
          <div>
            <img src={commonIllustrations.error} alt="attention" />
          </div>
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-lg-10")}>
          <h3>
            Votre demande d'accès à {toReviewAgencyRights.length}{" "}
            {toReviewAgencyRights.length === 1 ? "organisme" : "organismes"}{" "}
            {toReviewAgencyRights.length === 1
              ? "prescripteur"
              : "prescripteurs"}{" "}
            est en cours d'étude
          </h3>
          <p>
            Dès qu'un accès est validé par un administrateur, vous serez notifié
            par email et pourrez consulter les conventions de l'organisme dans
            votre espace personnel.
          </p>
          <OnGoingAgencyRightsTable
            agenciesWithToReviewRights={toReviewAgencyRights}
          />
        </div>
      </div>
    </>
  );
}
