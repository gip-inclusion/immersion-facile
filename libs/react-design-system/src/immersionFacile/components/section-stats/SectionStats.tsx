import React from "react";

import "./SectionStats.scss";

export type SectionStatsProps = {
  stats: Stat[];
};
export type Stat = {
  badgeLabel: string;
  value: string;
  subtitle: string;
  description?: string;
};

const componentName = "im-section-stats";
export const SectionStats = ({ stats }: SectionStatsProps) => (
  <section className={`${componentName} fr-py-8w `}>
    <div className={`fr-container ${componentName}__container`}>
      {stats && stats.length > 0 && (
        <div
          className={`${componentName}__items fr-grid-row fr-grid-row--gutters`}
        >
          {stats.map((stat, index) => (
            <StatCard key={`section-stats-item-${index}`} {...stat} />
          ))}
        </div>
      )}
    </div>
  </section>
);

const StatCard = ({ badgeLabel, value, subtitle, description }: Stat) => (
  <article className={`${componentName}__stat fr-col-lg-4 fr-px-2w`}>
    <span className={`${componentName}__stat-overtitle fr-badge`}>
      {badgeLabel}
    </span>
    <div className={`${componentName}__stat-content fr-mt-3w`}>
      <h3 className={`${componentName}__stat-value`}>{value}</h3>
      <div className={`${componentName}__stat-text`}>
        <span className={`${componentName}__stat-subtitle`}>{subtitle}</span>
        {description && (
          <p className={`${componentName}__stat-description`}>{description}</p>
        )}
      </div>
    </div>
  </article>
);
