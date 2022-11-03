import { MainWrapper } from "react-design-system";
import React from "react";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";

const statsPageUrl =
  "https://immersion-facile.osc-fr1.scalingo.io/public/dashboard/b226a68a-72a2-4d85-bb17-774a5d6e6480";

export const StatsPage = () => (
  <HeaderFooterLayout>
    <MainWrapper layout="default">
      <iframe
        src={statsPageUrl}
        frameBorder="0"
        width="100%"
        height="800"
      ></iframe>
    </MainWrapper>
  </HeaderFooterLayout>
);
