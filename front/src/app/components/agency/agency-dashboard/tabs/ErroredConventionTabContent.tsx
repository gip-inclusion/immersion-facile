import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import {
  AgencyRight,
  ConnectedUserJwt,
  WithAgencyDashboards,
  WithEstablishmentDashboards,
} from "shared";
import { MarkPartnersErroredConventionAsHandledFormSection } from "src/app/pages/agency-dashboard/MarkPartnersErroredConventionAsHandledFormSection";
import { MetabaseView } from "../../../MetabaseView";

export const ErroredConventionTabContent = (
  activeAgencyRights: AgencyRight[],
  inclusionConnectedJwt: ConnectedUserJwt | undefined,
  dashboards: WithAgencyDashboards & WithEstablishmentDashboards,
) => {
  const isUserHaveFtAgencyRight = activeAgencyRights.some(
    (agencyRight) => agencyRight.agency.kind === "pole-emploi",
  );

  return (
    <>
      {isUserHaveFtAgencyRight && (
        <Button
          priority="secondary"
          linkProps={{
            href: "https://poleemploi.sharepoint.com/:p:/r/sites/NAT-Mediatheque-Appropriation/Documents/Immersion_facilitee/Immersion_facilitee/Guide_de_gestion_des_conventions_en_erreur.pptx?d=w489a3c6b6e5148e6bea287ddfadba8c7&csf=1&web=1&e=i1GD5H",
            target: "_blank",
            rel: "noreferrer",
          }}
        >
          Guide de gestion des conventions en erreur
        </Button>
      )}
      {inclusionConnectedJwt ? (
        <MarkPartnersErroredConventionAsHandledFormSection
          jwt={inclusionConnectedJwt}
          isPeUser={isUserHaveFtAgencyRight}
        />
      ) : (
        <Alert
          severity="error"
          title="Non autorisé"
          description="Cette page est reservée aux utilisateurs connectés avec Inclusion Connect, et dont l'organisme est responsable de cette convention."
        />
      )}
      <MetabaseView
        title="Tableau de bord agence"
        url={dashboards.agencies.erroredConventionsDashboardUrl}
      />
      {isUserHaveFtAgencyRight && (
        <>
          <h2 className={fr.cx("fr-h5", "fr-mt-2w")}>
            Comment prévenir les erreurs :
          </h2>

          <h3 className={fr.cx("fr-h6")}>
            Identifiant National DE trouvé mais écart sur la date de naissance
          </h3>
          <p>
            Action → Modifier la date de naissance dans la demande pour
            correspondre à l'information présente dans le dossier du Demandeur
            d'emploi
          </p>

          <h3 className={fr.cx("fr-h6")}>Identifiant National DE non trouvé</h3>
          <p>
            Action → Soit le mail utilisé chez Immersion Facilitée est différent
            de celui du dossier du Demandeur d'emploi. Dans ce cas, modifier
            l'email dans le dossier du Demandeur d'emploi avant validation et
            avec son accord.
          </p>
          <p>
            Action → Soit le candidat n'est pas inscrit. Dans ce cas, procéder à
            l'inscription ou réinscription avant la validation .
          </p>
        </>
      )}
    </>
  );
};
