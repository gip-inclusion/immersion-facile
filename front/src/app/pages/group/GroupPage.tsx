import React, { useCallback, useEffect, useRef, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { makeStyles } from "tss-react/dsfr";
import { Route } from "type-route";
import { Group, GroupWithResults, SearchResultDto } from "shared";
import {
  Loader,
  MainWrapper,
  SectionAccordion,
  SectionTextEmbed,
} from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { searchGateway } from "src/config/dependencies";
import { GroupListResults } from "./GroupListResults";

type GroupPageProps = {
  route: Route<typeof routes.group>;
};
const useStyles = makeStyles({ name: "GroupPage" });

export const GroupPage = ({ route }: GroupPageProps) => {
  const { groupSlug } = route.params;
  const [initialResults, setInitialResults] = useState<SearchResultDto[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [group, setGroup] = useState<Group | null>(null);

  const getInitialGroupData = useCallback(async () => {
    setLoading(true);
    const response = await searchGateway.getGroupBySlug(groupSlug);
    const { group, results } = response;
    setGroup(group);
    setInitialResults(results);
  }, [groupSlug]);

  useEffect(() => {
    getInitialGroupData().finally(() => {
      setLoading(false);
    });
  }, [getInitialGroupData]);

  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0} layout="fullscreen">
        {!group || loading ? (
          <Loader />
        ) : (
          <GroupPageContent group={group} results={initialResults} />
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

const GroupPageContent = ({ group, results }: GroupWithResults) => {
  const searchBarRef = useRef<HTMLDivElement>(null);
  const { classes, cx } = useStyles(() => ({
    searchBar: {
      background: group.options.tintColor,
    },
    searchBarTitle: {
      color: "#fff",
    },
    heroHeader: {
      background: group.options.heroHeader.backgroundColor,
    },
  }))();
  const [displayedResults, setDisplayedResults] =
    useState<SearchResultDto[]>(results);

  const filterResults = useCallback((query: string) => {
    setDisplayedResults((results) =>
      results.filter((displayedResult: SearchResultDto) =>
        JSON.stringify(Object.values(displayedResult))
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    );
  }, []);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    filterResults(event.currentTarget.value);
  };

  const onHeroHeaderCtaClick = () => {
    if (searchBarRef.current) {
      searchBarRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <section
        className={cx(fr.cx("fr-py-8w", "fr-py-md-16w"), classes.heroHeader)}
      >
        <div
          className={fr.cx(
            "fr-grid-row",
            "fr-grid-row--middle",
            "fr-container",
          )}
        >
          <div className={fr.cx("fr-col", "fr-col-12", "fr-col-md-8")}>
            <h1>{group.options.heroHeader.title}</h1>
            <p>{group.options.heroHeader.description}</p>
            <Button priority="secondary" onClick={onHeroHeaderCtaClick}>
              Trouver une immersion
            </Button>
          </div>
          {group.options.heroHeader.logoUrl && (
            <div
              className={fr.cx(
                "fr-col-12",
                "fr-col-md-3",
                "fr-col-offset-md-1",
                "fr-hidden",
                "fr-unhidden-md",
              )}
            >
              <img src={group.options.heroHeader.logoUrl} alt={group.name} />
            </div>
          )}
        </div>
      </section>
      <section
        ref={searchBarRef}
        className={cx(fr.cx("fr-py-6w"), classes.searchBar)}
      >
        <div className={fr.cx("fr-container")}>
          <h2 className={cx(classes.searchBarTitle)}>
            {group.name} : toutes les immersions
          </h2>
          <form
            className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}
            onSubmit={onFilterSubmit}
          >
            <div className={fr.cx("fr-col-12", "fr-col-sm-8")}>
              <Input
                label={`Cherchez dans les immersions proposées par ${group.name}`}
                hideLabel
                nativeInputProps={{
                  onChange: (event) => filterResults(event.currentTarget.value),
                  placeholder:
                    "Filtrer les résultats en tapant le nom d'un métier ou d'une ville",
                }}
              />
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-sm-4")}>
              <Button>Filtrer les résultats</Button>
            </div>
          </form>
        </div>
      </section>
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
    </>
  );
};
