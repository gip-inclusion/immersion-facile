import { type FrCxArg, fr } from "@codegouvfr/react-dsfr";
import type { CSSProperties, ReactNode } from "react";
import { makeStyles } from "tss-react/dsfr";
import Styles from "./MainWrapper.styles";

type MainWrapperCommonProps = {
  vSpacing?: number;
  hSpacing?: number;
  children: ReactNode;
  className?: string;
  layout: "default" | "boxed" | "fullscreen";
  pageHeader?: ReactNode;
};

type WithBackground = {
  useBackground: true;
  backgroundStyles?: CSSProperties;
};

type WithoutBackground = {
  useBackground?: undefined | false;
  backgroundStyles?: never;
};

export type MainWrapperProps = MainWrapperCommonProps &
  (WithBackground | WithoutBackground);

export const MainWrapper = ({
  vSpacing = 8,
  hSpacing = 0,
  className,
  children,
  layout,
  pageHeader,
  useBackground,
  backgroundStyles,
}: MainWrapperProps) => {
  const { cx, classes } = makeStyles()(() => ({
    customBackground: {
      ...backgroundStyles,
    },
  }))();
  const classNameValue = cx(
    vSpacing ? fr.cx(`fr-py-${vSpacing}w` as FrCxArg) : "",
    hSpacing ? fr.cx(`fr-px-${hSpacing}w` as FrCxArg) : "",
    Styles.root,
    useBackground ? Styles.withBackground : "",
    className,
    layout !== "fullscreen" ? fr.cx("fr-container", "fr-grid-row--center") : "",
  );
  return (
    <>
      {pageHeader}
      <main className={classNameValue} id="main-content">
        {layout === "boxed" && (
          <div className={fr.cx("fr-grid-row")}>
            <div className={fr.cx("fr-col-lg-7", "fr-px-2w")}>{children}</div>
          </div>
        )}
        {layout !== "boxed" && children}
        {useBackground && (
          <div
            className={cx(Styles.customBackground, classes.customBackground)}
          />
        )}
      </main>
    </>
  );
};
