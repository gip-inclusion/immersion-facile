import React, { useEffect, useState } from "react";
import {
  MainWrapper,
  PageHeader,
  SectionAccordion,
  SectionTextEmbed,
} from "react-design-system";
import { Route } from "type-route";
import { makeStyles } from "tss-react/dsfr";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { GroupListResults } from "./GroupListResults";
import { routes } from "src/app/routes/routes";
import { AuthorizedGroupSlugs } from "src/app/routes/route-params";
import tempData from "./tempData";
import { fr } from "@codegouvfr/react-dsfr";
import { SearchImmersionResultDto } from "shared";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";

type GroupPageProps = {
  route: Route<typeof routes.group>;
};

export const GroupPage = ({ route }: GroupPageProps) => {
  const { groupName } = route.params;
  const groupTheme: Record<
    AuthorizedGroupSlugs,
    {
      name: string;
      theme: {
        tintColor: string;
      };
    }
  > = {
    decathlon: {
      name: "Décathlon",
      theme: {
        tintColor: "#0082c3",
      },
    },
  };
  const [displayedResults, setDisplayedResults] =
    useState<SearchImmersionResultDto[]>(tempData);
  const [query, setQuery] = useState<string>("");
  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayedResults(
      tempData.filter((displayedResult: SearchImmersionResultDto) =>
        JSON.stringify(Object.values(displayedResult))
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    );
  };
  useEffect(() => {
    setDisplayedResults(
      tempData.filter((displayedResult: SearchImmersionResultDto) =>
        JSON.stringify(Object.values(displayedResult))
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    );
  }, [query]);
  const { classes } = makeStyles({ name: "GroupPage" })(() => ({
    root: {
      backgroundColor: groupTheme[groupName].theme.tintColor,
    },
  }))();
  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0} layout="fullscreen">
        <PageHeader
          title={`${groupTheme[groupName].name} : toutes les immersions`}
          theme="establishment"
          classes={classes}
        >
          <form
            className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}
            onSubmit={onFilterSubmit}
          >
            <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
              <Input
                label={`Cherchez dans les immersions proposées par ${groupTheme[groupName].name}`}
                hideLabel
                nativeInputProps={{
                  onChange: (event) => setQuery(event.currentTarget.value),
                  placeholder:
                    "Filtrer les résultats en tapant un métier ou une ville",
                }}
              />
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-lg-3")}>
              <Button>Filtrer les résultats</Button>
            </div>
          </form>
        </PageHeader>
        <div className={fr.cx("fr-mt-6w")}>
          <GroupListResults results={displayedResults} />
          <SectionAccordion />
          <SectionTextEmbed
            videoUrl=" https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise.mp4"
            videoPosterUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_poster.webp"
            videoDescription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.vtt"
            videoTranscription="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_transcript.txt"
          />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
