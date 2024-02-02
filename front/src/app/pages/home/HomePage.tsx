import { createModal } from "@codegouvfr/react-dsfr/Modal";
import React from "react";
import {
  FixedStamp,
  HeroHeader,
  MainWrapper,
  SectionFaq,
  SectionStats,
  SectionTextEmbed,
} from "react-design-system";
import { useDispatch } from "react-redux";
import { SiretModalContent } from "src/app/components/SiretModalContent";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import {
  heroHeaderContent,
  heroHeaderNavCards,
  sectionFaqData,
  sectionStatsData,
} from "src/app/contents/home/content";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
export type UserType = "default" | "candidate" | "establishment" | "agency";

type HomePageProps = {
  type: UserType;
};

const { Component: SiretModal, open: openSiretModal } = createModal({
  isOpenedByDefault: false,
  id: "siret",
});

export const HomePage = ({ type }: HomePageProps) => {
  const { enableTemporaryOperation } = useFeatureFlags();
  const storeDispatch = useDispatch();

  const heroHeaderNavCardsWithDispatch = heroHeaderNavCards(
    storeDispatch,
    openSiretModal,
  );
  const { title, subtitle, displayName, icon, illustration } =
    heroHeaderContent[type];
  const sectionStatsDataForType = sectionStatsData[type];
  const sectionFaqDataForType = sectionFaqData[type];
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="fullscreen" vSpacing={0} useBackground>
        <HeroHeader
          title={title}
          description={subtitle}
          illustration={illustration}
          type={type}
          typeDisplayName={displayName}
          icon={icon}
          patterns
          navCards={heroHeaderNavCardsWithDispatch[type]}
          parallax
          siretModal={
            <SiretModal title="Créer ou modifier votre établissement">
              <SiretModalContent />
            </SiretModal>
          }
        />
        <SectionStats stats={sectionStatsDataForType} />
        <SectionTextEmbed
          videoUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise.mp4"
          videoPosterUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_poster.webp"
          videoDescription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.vtt"
          videoTranscription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.txt"
        />
        <SectionFaq articles={sectionFaqDataForType} />
      </MainWrapper>
      {enableTemporaryOperation.isActive &&
        enableTemporaryOperation.kind === "textImageAndRedirect" && (
          <FixedStamp
            image={
              <img
                src={enableTemporaryOperation.value.imageUrl}
                alt={enableTemporaryOperation.value.imageAlt}
              />
            }
            subtitle={enableTemporaryOperation.value.message}
            link={{
              href: enableTemporaryOperation.value.redirectUrl,
            }}
            title={enableTemporaryOperation.value.title}
            overtitle={enableTemporaryOperation.value.overtitle}
          />
        )}
    </HeaderFooterLayout>
  );
};
