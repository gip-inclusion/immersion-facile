ALTER TABLE public.form_establishments 
ADD IF NOT EXISTS "business_name_customized" varchar(255) NULL;

ALTER TABLE public.form_establishments 
ADD IF NOT EXISTS "is_engaged_enterprise" bool NULL;

