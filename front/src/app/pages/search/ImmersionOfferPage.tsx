import React, { useEffect } from "react";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useRoute } from "src/app/routes/routes";

export const ImmersionOfferPage = () => {
  const _route = useRoute();
  useEffect(() => {
    //immersionOfferGateway.get(siret, appellationCode);
  }, []);
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <h1>Offre d'immersion</h1>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
