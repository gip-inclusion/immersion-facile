import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import { domElementIds, loginPeConnect } from "shared";
import illustrationForm from "src/assets/img/fill-convention-form.svg";
import illustrationHelp from "src/assets/img/fill-convention-help.svg";
import illustrationPe from "src/assets/img/fill-convention-pe.svg";

type InitiateConventionCardProps = {
  onNotPeConnectButtonClick: () => void;
};

export const InitiateConventionSection = ({
  onNotPeConnectButtonClick,
}: InitiateConventionCardProps) => (
  <section>
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      <div
        className={fr.cx("fr-col-12", "fr-col-md-4")}
        onClick={onNotPeConnectButtonClick}
      >
        <Card
          background
          border
          desc={
            <>
              Je suis <strong>une entreprise</strong>,{" "}
              <strong>un candidat</strong> sans identifiants Pôle emploi,{" "}
              <strong>un conseiller accompagnant un candidat</strong>.
            </>
          }
          enlargeLink
          imageAlt=""
          imageUrl={illustrationForm}
          linkProps={{
            href: "#",
            id: domElementIds.conventionImmersionRoute.showFormButton,
          }}
          size="medium"
          title="Je remplis une convention sans identifiants Pôle emploi"
          titleAs="h2"
        />
      </div>

      <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
        <Card
          background
          border
          desc={
            <>
              Je suis <strong>un candidat inscrit à Pôle emploi</strong>. Je me
              connecte avec Pôle emploi pour accélérer les démarches.
            </>
          }
          enlargeLink
          imageAlt=""
          imageUrl={illustrationPe}
          linkProps={{
            href: `/api/${loginPeConnect}`,
          }}
          size="medium"
          title="Je remplis une convention avec mes identifiants Pôle emploi"
          titleAs="h2"
        />
      </div>

      <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
        <Card
          background
          border
          desc={
            <>
              <strong>Je ne reçois pas le lien de signature</strong>, je me suis{" "}
              <strong>trompé dans les informations</strong>, je souhaite{" "}
              <strong>modifier ou renouveler une convention</strong>.
            </>
          }
          enlargeLink
          imageAlt=""
          imageUrl={illustrationHelp}
          linkProps={{
            href: "https://tally.so/r/mBdQQe",
            target: "_blank",
          }}
          size="medium"
          title="J’ai déjà rempli une demande de convention mais j’ai un problème"
          titleAs="h2"
        />
      </div>
    </div>
    <div
      className={fr.cx("fr-mt-5w", "fr-btns-group", "fr-btns-group--center")}
    >
      <a
        href="https://tally.so/r/w2X7xV"
        className={fr.cx(
          "fr-link",
          "fr-icon-arrow-right-line",
          "fr-link--icon-right",
        )}
      >
        Je ne sais pas si je peux remplir une convention en ligne dans mon cas
      </a>
    </div>
  </section>
);
