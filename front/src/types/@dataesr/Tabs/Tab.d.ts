import * as React from "react";

export type TabClassName = string | any | any[];

export interface TabProps {
  className?: TabClassName;
  label: string;
  index: number;
}

declare const Tab: React.FC<TabProps>;

export default Tab;
