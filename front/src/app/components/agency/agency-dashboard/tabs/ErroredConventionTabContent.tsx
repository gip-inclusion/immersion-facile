import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import {
  AgencyRight,
  InclusionConnectJwt,
  WithAgencyDashboards,
  WithEstablishmentDashboards,
} from "shared";
import { MarkPartnersErroredConventionAsHandledFormSection } from "src/app/pages/agency-dashboard/MarkPartnersErroredConventionAsHandledFormSection";
import { MetabaseView } from "../../../MetabaseView";

export const ErroredConventionTabContent = (
  activeAgencyRights: AgencyRight[],
  inclusionConnectedJwt: InclusionConnectJwt | undefined,
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
            href: "https://view.officeapps.live.com/op/embed.aspx?src=https://mediatheque.francetravail.fr/documents/Immersion_facilitee/GUIDE_SAISIE_(de_gestion)_DES_CONVENTIONS_(en_erreur).pptx",
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
