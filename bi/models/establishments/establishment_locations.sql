{{
  config(
    materialized='table',
    schema='analytics',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_establishment_locations_siret ON {{ this }} (establishment_siret)",
      "CREATE INDEX IF NOT EXISTS idx_establishment_locations_department ON {{ this }} (department_code)"
    ]
  )
}}

select
    eli.id,
    eli.establishment_siret,
    eli.street_number_and_address,
    eli.post_code,
    eli.city,
    eli.department_code,
    eli.lat,
    eli.lon,
    pdr.department_name,
    pdr.region_name
from {{ source('immersion', 'establishments_location_infos') }} as eli
left join {{ source('immersion', 'public_department_region') }} as pdr
    on pdr.department_code = eli.department_code
