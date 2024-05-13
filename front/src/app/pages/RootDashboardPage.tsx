import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { MainWrapper } from "react-design-system";
import { HeroHeaderNavCard, NavCard } from "react-design-system";
import { domElementIds } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";

const navCards: HeroHeaderNavCard[] = [
  {
    overtitle: "Entreprise",
    title: "Je suis le représentant d'une entreprise",
    icon: "fr-icon-building-line",
    type: "candidate",
    id: domElementIds.rootDashboard.establishment.link,
    link: routes.establishmentDashboard().link,
    wrapperClassName: "root-dashboard-page",
  },
  {
    overtitle: "Agence",
    title: "Je représente une structure",
    icon: "fr-icon-map-pin-user-line",
    type: "agency",
    id: domElementIds.rootDashboard.agency.link,
    link: routes.agencyDashboard().link,
    wrapperClassName: "root-dashboard-page",
  },
];

export const RootDashboardPage = () => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="fullscreen"
      useBackground
      backgroundStyles={{
        backgroundColor: "var(--blue-france-sun-113-625)",
      }}
    >
      <div
        className={fr.cx(
          "fr-grid-row",
          "fr-grid-row--gutters",
          "fr-grid-row--center",
        )}
      >
        <div className={fr.cx("fr-col-8")}>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {navCards.map((card) => (
              <NavCard
                {...card}
                total={navCards.length}
                key={`${card.type}-${card.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    </MainWrapper>
  </HeaderFooterLayout>
);
