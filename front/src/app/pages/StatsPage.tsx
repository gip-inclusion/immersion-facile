import { Tabs } from "@codegouvfr/react-dsfr/Tabs";

import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { MetabaseView } from "src/app/components/MetabaseView";
import { globalStatsUrl, immersionStatsUrl } from "src/app/contents/statsUrls";

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
