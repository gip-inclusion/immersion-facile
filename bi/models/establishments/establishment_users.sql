{{
  config(
    materialized='table',
    schema='analytics',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_establishment_users_siret ON {{ this }} (siret)",
      "CREATE INDEX IF NOT EXISTS idx_establishment_users_user_id ON {{ this }} (user_id)"
    ]
  )
}}

select
    eu.siret::text as siret,
    eu.user_id,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name,
    concat(u.first_name, ' ', u.last_name) as user_full_name,
    eu.role,
    eu.job,
    eu.phone,
    eu.should_receive_discussion_notifications,
    eu.is_main_contact_by_phone,
    eu.is_main_contact_in_person,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at,
    u.pro_connect_sub,
    u.pro_connect_siret::text as pro_connect_siret,
    u.last_login_at
from {{ source('immersion', 'establishments__users') }} as eu
inner join {{ source('immersion', 'users') }} as u
    on u.id = eu.user_id
