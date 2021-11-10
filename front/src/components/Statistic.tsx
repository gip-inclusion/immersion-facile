import React from "react";

type StatisticProps = {
  title: string;
  subtitle: string;
  stat: number;
  text: string;
};

export const Statistic = ({ title, subtitle, stat, text }: StatisticProps) => (
  <div className="flex flex-col w-64 py-5">
    <div className="text-immersionBlue-dark font-bold">{title}</div>
    <div className="self-center w-52 text-center text-immersionBlue-light font-bold">
      {subtitle}
    </div>
    <div className="flex mt-3">
      <div className="text-4xl text-immersionBlue-light font-bold">{stat}%</div>
      <div className="pl-3 text-sm font-light">{text}</div>
    </div>
  </div>
);
