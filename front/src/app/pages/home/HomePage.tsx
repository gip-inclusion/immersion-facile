import {
  FixedStamp,
  HeroHeader,
  MainWrapper,
  SectionFaq,
  SectionStats,
  SectionTextEmbed,
} from "react-design-system";
import { useDispatch } from "react-redux";
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

export const HomePage = ({ type }: HomePageProps) => {
  const { enableTemporaryOperation } = useFeatureFlags();
  const storeDispatch = useDispatch();

  const heroHeaderNavCardsWithDispatch = heroHeaderNavCards(storeDispatch);
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
