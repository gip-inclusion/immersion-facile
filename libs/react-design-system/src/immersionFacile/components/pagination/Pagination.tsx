import React from "react";

type PaginationProps = {
  totalPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

export const Pagination = ({
  totalPages,
  currentPage,
  setCurrentPage,
}: PaginationProps) => (
  <nav
    role="navigation"
    className="fr-pagination fr-mt-4w"
    aria-label="Pagination"
  >
    <ul className="fr-pagination__list">
      <li>
        <button
          className="fr-pagination__link fr-pagination__link--first"
          aria-disabled={currentPage === 0}
          disabled={currentPage === 0}
          role="link"
          onClick={() => setCurrentPage(0)}
        >
          Première page
        </button>
      </li>
      <li>
        <button
          className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
          disabled={currentPage === 0}
          aria-disabled={currentPage === 0}
          onClick={() => setCurrentPage((currentPage) => currentPage - 1)}
        >
          Page précédente
        </button>
      </li>
      {Array.from(Array(totalPages + 1).keys()).map((_, index) => (
        <li key={index}>
          <button
            className="fr-pagination__link"
            aria-current={currentPage === index ? "page" : undefined}
            role="link"
            onClick={() => setCurrentPage(index)}
          >
            {index + 1}
          </button>
        </li>
      ))}
      <li>
        <button
          className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
          onClick={() => setCurrentPage((currentPage) => currentPage + 1)}
          aria-disabled={currentPage === totalPages}
          disabled={currentPage === totalPages}
        >
          Page suivante
        </button>
      </li>
      <li>
        <button
          className="fr-pagination__link fr-pagination__link--last"
          aria-disabled={currentPage === totalPages}
          disabled={currentPage === totalPages}
          role="link"
          onClick={() => setCurrentPage(totalPages)}
        >
          Dernière page
        </button>
      </li>
    </ul>
  </nav>
);
