import React from "react";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { EstablishmentCreationForm } from "./EstablishmentCreationForm";

export const EstablishmentFormImmersionFacilePage = () => (
  <HeaderFooterLayout>
    <EstablishmentCreationForm source="immersion-facile" />
  </HeaderFooterLayout>
);
