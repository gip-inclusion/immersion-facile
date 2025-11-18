{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

select
    id,
    establishment_siret,
    street_number_and_address,
    post_code,
    city,
    department_code,
    lat,
    lon
from {{ source('immersion', 'establishments_location_infos') }}
