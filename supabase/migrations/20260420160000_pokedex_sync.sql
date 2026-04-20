-- Task 14: 图鉴极简上云 + 只读排行榜 RPC（anon 对表仅 INSERT；读榜走 SECURITY DEFINER 函数）

create table if not exists public.pokedex_sync (
  id bigint generated always as identity primary key,
  device_id uuid not null,
  result_type text not null,
  achieved_title text not null,
  heat_percentage text not null,
  kpi smallint not null,
  shield smallint not null,
  mental smallint not null,
  rounds_survived smallint not null,
  created_at timestamptz not null default now(),
  constraint pokedex_sync_result_type_check check (result_type in ('dead', 'cleared'))
);

comment on table public.pokedex_sync is '结算元数据上云；不含 fatal_quote / 图片。anon 仅 INSERT。';
comment on column public.pokedex_sync.rounds_survived is '结算时存活到的回合数（死亡为当前回合，通关为 5），用于榜单排序。';

create index if not exists pokedex_sync_leaderboard_idx
  on public.pokedex_sync (rounds_survived desc, created_at desc);

alter table public.pokedex_sync enable row level security;

create policy pokedex_sync_anon_insert_only
  on public.pokedex_sync
  for insert
  to anon
  with check (true);

grant insert on table public.pokedex_sync to anon;

-- 仅暴露聚合后的 Top20，不授予对基表的 SELECT，避免全表被扫。
create or replace function public.get_leaderboard_top20()
returns table (
  lb_rank integer,
  anon_suffix text,
  result_type text,
  achieved_title text,
  heat_percentage text,
  rounds_survived smallint,
  kpi smallint,
  shield smallint,
  mental smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (row_number() over (
      order by
        p.rounds_survived desc,
        coalesce(
          nullif(
            regexp_replace(replace(p.heat_percentage, '%', ''), '[^0-9]', '', 'g'),
            ''
          )::integer,
          0
        ) desc,
        p.created_at desc
    ))::integer as lb_rank,
    right(replace(p.device_id::text, '-', ''), 4) as anon_suffix,
    p.result_type,
    p.achieved_title,
    p.heat_percentage,
    p.rounds_survived,
    p.kpi,
    p.shield,
    p.mental
  from public.pokedex_sync p
  order by
    p.rounds_survived desc,
    coalesce(
      nullif(
        regexp_replace(replace(p.heat_percentage, '%', ''), '[^0-9]', '', 'g'),
        ''
      )::integer,
      0
    ) desc,
    p.created_at desc
  limit 20;
$$;

comment on function public.get_leaderboard_top20() is '匿名 Top20；SECURITY DEFINER 读 pokedex_sync，客户端禁止直接 SELECT 表。';

revoke all on function public.get_leaderboard_top20() from public;
grant execute on function public.get_leaderboard_top20() to anon;
