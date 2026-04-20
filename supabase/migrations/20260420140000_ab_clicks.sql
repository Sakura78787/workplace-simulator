-- Task 13: A/B 分享/保存点击轻量埋点（anon 仅 INSERT，禁 SELECT/UPDATE/DELETE）
-- 字段约定见 memory-bank/decision-log.md

create table if not exists public.ab_clicks (
  id bigint generated always as identity primary key,
  device_id uuid not null,
  variant text not null,
  event text not null,
  created_at timestamptz not null default now(),
  constraint ab_clicks_variant_check check (variant in ('self_mock', 'pk_taunt'))
);

comment on table public.ab_clicks is '分享/保存按钮 A/B 点击埋点；仅允许 anon INSERT。';

create index if not exists ab_clicks_device_id_idx on public.ab_clicks (device_id);
create index if not exists ab_clicks_created_at_idx on public.ab_clicks (created_at desc);

alter table public.ab_clicks enable row level security;

-- 默认拒绝所有；显式只允许 anon 插入一行新数据。
create policy ab_clicks_anon_insert_only
  on public.ab_clicks
  for insert
  to anon
  with check (true);

grant insert on table public.ab_clicks to anon;
