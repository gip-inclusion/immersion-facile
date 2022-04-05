import { EstablishmentCreationForm } from "./EstablishmentCreationForm";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import React from "react";

export const EstablishmentFormImmersionFacilePage = () => (
  <HeaderFooterLayout>
    <EstablishmentCreationForm source="immersion-facile" />
  </HeaderFooterLayout>
);
