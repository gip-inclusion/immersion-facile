import React from "react";

interface CardProps {
  children: React.ReactNode;
  type: "candidate" | "establishment";
  className?: string;
}

export const Section = ({ children, className, type }: CardProps) => {
  const colorClasses =
    type === "candidate" ? "border-red-200" : "border-blue-200";

  return (
    <div
      className={`${className} ${colorClasses} border-2 flex flex-col items-center justify-between fr-px-4v fr-p-1v fr-pb-4v  fr-m-2v w-[400px]`}
    >
      {children}
    </div>
  );
};
