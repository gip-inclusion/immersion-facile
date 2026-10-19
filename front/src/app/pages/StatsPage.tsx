import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { MetabaseView } from "src/app/components/MetabaseView";
import { publicStatsUrl } from "src/app/contents/statsUrls";

export const StatsPage = () => (
  <HeaderFooterLayout>
    <MainWrapper layout="default">
      <MetabaseView title="Statistiques" url={publicStatsUrl} />
    </MainWrapper>
  </HeaderFooterLayout>
);
