-- ============================================================
-- 我的成长花园（云端多人版）· Supabase 初始化脚本
-- 用法：登录 Supabase → SQL Editor → 粘贴本文件全部内容 → Run
-- 本脚本幂等，可重复执行（create table if not exists / 策略与发布去重）
-- ============================================================

-- ---------- 1. 数据表 ----------
create table if not exists categories (
  id          text primary key,
  name        text,
  emoji       text,
  sort_order  int,
  active      int
);

create table if not exists tasks (
  id           text primary key,
  category_id  text,
  name         text,
  emoji        text,
  scheduled_time text,
  duration     int,
  repeat_mode  text,
  repeat_days  text,
  active       int,
  sort_order   int,
  start_date   text,
  end_date     text
);

create table if not exists checkins (
  id         text primary key,
  task_id    text,
  date       text,
  status     text,
  checked_at text,
  checked_by text
);

create table if not exists redemptions (
  id          text primary key,
  type        text,
  amount      int,
  points      int,
  status      text,
  created_at  text,
  resolved_at text
);

create table if not exists settings (
  id                       text primary key,
  child_name               text,
  mom_pin                  text,
  flowers_per_redemption   int,
  points_per_redemption    int
);

-- ---------- 2. 授权（重要：必须显式把表权限授予 anon，否则只能写不能读）----------
grant all on all tables in schema public to anon;
grant all on all sequences in schema public to anon;
alter default privileges in schema public grant all on tables to anon;

-- ---------- 3. 行级安全（RLS）----------
-- 说明：这是一份「家庭共享数据集」，前端用统一的 anon key 访问，
--       真正的权限由应用内的「妈妈 PIN」控制。故对 anon 放开全权限。
alter table categories enable row level security;
alter table tasks       enable row level security;
alter table checkins    enable row level security;
alter table redemptions enable row level security;
alter table settings     enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='categories' and policyname='anon_all') then
    create policy anon_all on categories for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='anon_all') then
    create policy anon_all on tasks for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='checkins' and policyname='anon_all') then
    create policy anon_all on checkins for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='redemptions' and policyname='anon_all') then
    create policy anon_all on redemptions for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='settings' and policyname='anon_all') then
    create policy anon_all on settings for all to anon using (true) with check (true);
  end if;
end $$;

-- ---------- 3. 实时推送（Realtime）----------
-- 把五张表加入 supabase_realtime 发布，前端订阅后即可毫秒级同步
do $$
begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='categories') then
    alter publication supabase_realtime add table categories;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='tasks') then
    alter publication supabase_realtime add table tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='checkins') then
    alter publication supabase_realtime add table checkins;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='redemptions') then
    alter publication supabase_realtime add table redemptions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='settings') then
    alter publication supabase_realtime add table settings;
  end if;
end $$;
