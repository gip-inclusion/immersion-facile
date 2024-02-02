import React from "react";
import { MainWrapper } from "react-design-system";
import { MetabaseView } from "src/app/components/MetabaseView";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const statsPageUrl =
  "https://metabase.immersion-facile.beta.gouv.fr/public/dashboard/93afb41e-949d-4677-aab3-95817f81223d";

export const StatsPage = () => (
  <HeaderFooterLayout>
    <MainWrapper layout="default">
      <MetabaseView title="Statistiques" url={statsPageUrl} />
    </MainWrapper>
  </HeaderFooterLayout>
);
