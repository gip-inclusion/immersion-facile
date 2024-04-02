import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React from "react";
import { MainWrapper } from "react-design-system";
import { MetabaseView } from "src/app/components/MetabaseView";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const globalStatsUrl =
  "https://metabase.immersion-facile.beta.gouv.fr/public/dashboard/93afb41e-949d-4677-aab3-95817f81223d";

export const immersionStatsUrl =
  "https://metabase.immersion-facile.beta.gouv.fr/public/dashboard/531a7757-5e85-4ed7-a958-94f4b493a11a";

const tabs: Array<{
  label: string;
  content: JSX.Element;
}> = [
  {
    label: "Global",
    content: <MetabaseView title="Statistiques" url={globalStatsUrl} />,
  },
  {
    label: "Immersion",
    content: <MetabaseView title="Statistiques" url={immersionStatsUrl} />,
  },
];

export const StatsPage = () => (
  <HeaderFooterLayout>
    <MainWrapper layout="default">
      <Tabs tabs={tabs} />
    </MainWrapper>
  </HeaderFooterLayout>
);
