import { HeadingSection, type HeadingSectionProps } from "react-design-system";

export const BackofficeDashboardTabContent = (props: HeadingSectionProps) => {
  return (
    <HeadingSection
      {...props}
      titleAs="h1"
      className={props.className ? props.className : "fr-mt-0 fr-mb-0"}
    >
      {props.children}
    </HeadingSection>
  );
};
