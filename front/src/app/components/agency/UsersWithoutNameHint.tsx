import { fr } from "@codegouvfr/react-dsfr";

import { Tooltip } from "react-design-system";
import { domElementIds } from "shared";

export const UsersWithoutNameHint = () => (
  <p className={fr.cx("fr-mb-2w", "fr-mt-0", "fr-hint-text")}>
    Pourquoi certains utilisateurs n'ont pas de nom ?
    <Tooltip
      type="click"
      description="Certains utilisateurs n'ont pas de compte ProConnect. Ils
            peuvent se créer un compte avec la même adresse email pour ajouter
            leurs infos et accéder à leur espace personnel."
      id={domElementIds.admin.agencyTab.editAgencyUserTooltip}
    />
  </p>
);
