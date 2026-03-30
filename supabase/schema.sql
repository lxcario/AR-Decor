-- Products table (extend existing if present)
create table if not exists products (
  id           text primary key,
  slug         text unique not null,
  name         text not null,
  brand        text,
  price        numeric,
  currency     text default 'TRY',
  description  text,
  asin         text,
  category     text,
  model_glb    text,
  model_usdz   text,
  poster_url   text,
  width_m      numeric,
  height_m     numeric,
  depth_m      numeric,
  placement    text default 'floor',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Model generation jobs
create table if not exists model_jobs (
  job_id       text primary key,
  product_id   text references products(id),
  status       text not null default 'queued',
  strategy     text,
  model_url    text,
  error        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Index for polling
create index if not exists model_jobs_product_id on model_jobs(product_id);
create index if not exists model_jobs_status on model_jobs(status);

