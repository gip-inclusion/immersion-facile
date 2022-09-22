import React from "react";

interface CardProps {
  children: React.ReactNode;
  type: "candidate" | "establishment";
  className?: string;
}

export const Section = ({ children, className, type }: CardProps) => {
  const colorClasses =
    type === "candidate"
      ? "border-red-200 bg-red-50"
      : "border-blue-200 bg-blue-50";

  return (
    <div
      className={`${className} ${colorClasses} border-2 flex flex-col items-center rounded justify-between fr-px-4v fr-p-1v fr-pb-4v  fr-m-2v w-[400px]`}
    >
      {children}
    </div>
  );
};
