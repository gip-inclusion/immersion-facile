import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { InclusionConnectedUser, domElementIds } from "shared";

export const PersonnalInformationsSection = ({
  user,
  editInformationsLink,
}: {
  user: InclusionConnectedUser;
  editInformationsLink?: string;
}) => (
  <>
    <h2 className={fr.cx("fr-h4")}>Informations personnelles</h2>

    <ul className={fr.cx("fr-text--sm", "fr-mb-2w")}>
      <li>Id de l'utilisateur: {user.id}</li>
      <li id={domElementIds.profile.email}>Email : {user.email}</li>
      {user.firstName && (
        <li id={domElementIds.profile.firstName}>Prénom : {user.firstName}</li>
      )}
      {user.lastName && (
        <li id={domElementIds.profile.lastName}>Nom : {user.lastName}</li>
      )}
    </ul>

    {editInformationsLink && (
      <Button
        className={fr.cx("fr-mb-4w")}
        priority="secondary"
        linkProps={{
          href: editInformationsLink,
          target: "_blank",
        }}
        id={domElementIds.profile.updateOwnInfosLink}
      >
        Modifier mes informations
      </Button>
    )}
  </>
);
