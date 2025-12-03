{{
  config(
    materialized='table',
    schema='public_analytics',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_conv_count_status ON {{ this }} (status_technical)",
      "CREATE INDEX IF NOT EXISTS idx_conv_count_agency_status ON {{ this }} (agency_status)",
      "CREATE INDEX IF NOT EXISTS idx_conv_count_date_start ON {{ this }} (date_start)",
      "CREATE INDEX IF NOT EXISTS idx_conv_count_date_validation ON {{ this }} (date_validation)",
      "CREATE INDEX IF NOT EXISTS idx_conv_count_department ON {{ this }} (agency_department_name)",
      "CREATE INDEX IF NOT EXISTS idx_conv_count_region ON {{ this }} (agency_region_name)",
      "CREATE INDEX IF NOT EXISTS idx_conv_count_agency_id ON {{ this }} (agency_id)",
      "CREATE INDEX IF NOT EXISTS idx_conv_count_agency_name ON {{ this }} (agency_name)",
      "CREATE INDEX IF NOT EXISTS idx_conv_count_siret ON {{ this }} (siret)",
    ]
  )
}}

select
    id,
    siret,
    agency_id,
    agency_name,
    status_technical,
    agency_status,
    agency_kind,
    agency_department_name,
    agency_region_name,
    date_validation,
    date_submission,
    date_start,
    date_end,
    rome_code,
    appellation_code,
    establishment_department_name,
    establishment_region_name
from {{ ref('conventions') }}
