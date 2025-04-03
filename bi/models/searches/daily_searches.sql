{{
    config(
        materialized='table',
        schema='analytics'
    )
}}

select
    DATE_TRUNC('day', update_date) AS day,
    COUNT(DISTINCT id) AS number_of_searches
FROM searches_made
WHERE update_date IS NOT NULL
  AND update_date >= '2024-01-01'
GROUP BY day 