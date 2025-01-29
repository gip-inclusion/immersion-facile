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
    <h2 className={fr.cx("fr-h4", "fr-mt-2w")}>Informations personnelles</h2>

    <p>
      Pour modifier vos informations personnelles, vous devez passer par votre
      compte ProConnect créé avec l'email : {user.email}
    </p>

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
        Changer mes informations sur ProConnect
      </Button>
    )}
  </>
);
