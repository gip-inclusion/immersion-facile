import SearchIcon from "@mui/icons-material/Search";
import React from "react";
import { LinkWithButtonStyle } from "src/app/components/LinkWithButtonStyle";
import { Section } from "src/app/components/Section";
import { EstablishmentSubTitle } from "src/app/pages/home/components/EstablishmentSubTitle";
import { EstablishmentTitle } from "src/app/pages/home/components/EstablishmentTitle";
import { routes } from "src/app/routing/routes";

const styleType = "candidate";

export const FindImmersionHomeMenu = () => (
  <Section type={styleType}>
    <div className="flex flex-col">
      <EstablishmentTitle type={styleType} text="CANDIDAT À UNE IMMERSION" />
      <EstablishmentSubTitle
        type={styleType}
        text="Vous voulez essayer un métier en conditions réelles ?"
      />
    </div>
    <div className="flex flex-col w-full h-full items-center justify-center">
      <LinkWithButtonStyle {...routes.search().link}>
        Trouver une entreprise accueillante <SearchIcon />
      </LinkWithButtonStyle>
    </div>
  </Section>
);
