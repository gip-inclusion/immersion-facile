import SearchIcon from "@mui/icons-material/Search";
import React from "react";
import { LinkWithButtonStyle } from "src/app/components/LinkWithButtonStyle";
import { Section } from "src/app/components/Section";
import { EstablishmentSubTitle } from "src/app/components/EstablishmentSubTitle";
import { EstablishmentTitle } from "src/app/components/EstablishmentTitle";
import { routes } from "src/app/routes/routes";

const styleType = "candidate";

export const FindImmersionHomeMenu = () => (
  <Section type={styleType}>
    <div className="flex flex-col">
      <EstablishmentTitle type={styleType} text="CANDIDAT" />
      <EstablishmentSubTitle
        type={styleType}
        text="Je souhaite découvrir un métier en conditions réelles"
      />
    </div>
    <div className="flex flex-col w-full h-full items-center justify-center">
      <LinkWithButtonStyle {...routes.search().link}>
        Rechercher une entreprise <SearchIcon />
      </LinkWithButtonStyle>
    </div>
  </Section>
);
