import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";
import {
  type EstablishmentNameAndAdmins,
  type SiretDto,
  toFormatedTextSiret,
} from "shared";
import { commonIllustrations } from "src/assets/img/illustrations";

type EstablishmentDashboardAccessNotAllowedContentProps = {
  establishmentNameAndAdmins: EstablishmentNameAndAdmins;
  siret: SiretDto;
};

export const EstablishmentDashboardAccessNotAllowedContent = ({
  establishmentNameAndAdmins,
  siret,
}: EstablishmentDashboardAccessNotAllowedContentProps): ReactNode => (
  <div className={fr.cx("fr-grid-row")}>
    <div
      className={fr.cx("fr-hidden", "fr-unhidden-lg", "fr-col-2", "fr-pr-2w")}
    >
      <div>
        <img src={commonIllustrations.reachData} alt="attention" />
      </div>
    </div>
    <div className={fr.cx("fr-col-12", "fr-col-lg-10")}>
      <h3>Contacter votre administrateur</h3>
      <p>
        L’établissement {establishmentNameAndAdmins.name} est bien référencé
        chez Immersion Facilitée sous le numéro de SIRET
        {toFormatedTextSiret(siret)}, mais votre adresse mail ne correspond à
        aucun rôle. Veuillez contacter l'administrateur de l’établissement à via
        :{" "}
        {establishmentNameAndAdmins.adminEmails
          .map((email) => (
            <a href={email} key={email}>
              {email}
            </a>
          ))
          .join(", ")}
      </p>
    </div>
  </div>
);
