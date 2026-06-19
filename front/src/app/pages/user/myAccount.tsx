import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import Card from "@codegouvfr/react-dsfr/Card";
import { MainWrapper, PageHeader } from "react-design-system";
import { frontRoutes } from "shared";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { commonIllustrations } from "src/assets/img/illustrations";
import type { Route } from "type-route";

export const MyAccount = ({
  route,
}: {
  route: Route<typeof frontRoutes.myAccount>;
}) => {
  return (
    <MainWrapper
      layout="default"
      pageHeader={
        <PageHeader title={"Mon compte"} breadcrumbs={<Breadcrumbs />} />
      }
    >
      <CallOut
        title="Paramètres du compte"
        buttonProps={{
          size: "small",
          priority: "secondary",
          linkProps: { href: frontRoutes.myProfile().href },
          children: "Accéder aux paramètres",
        }}
      >
        <p>
          Vous agissez en tant que Pierre Dupont. Pour gérer vos rattachements
          ou modifier vos informations personnelles, rendez-vous dans vos
          paramètres.
        </p>
      </CallOut>
      <div className={fr.cx("fr-mt-10w")}>
        <Card
          title="Espace entreprise"
          endDetail="Gérer vos offres d’immersions, accéder aux mises en relation et conventions."
          badge={<Badge>X entreprises</Badge>}
          imageComponent={
            <img src={commonIllustrations.monCompte} alt="" aria-hidden />
          }
          horizontal
        />
      </div>
    </MainWrapper>
  );
};
