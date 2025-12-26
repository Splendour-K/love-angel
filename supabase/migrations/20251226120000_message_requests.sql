-- Messaging request flow: one initial message, acceptance to unlock conversation, rejection blocks for 30 days

-- 1) Enum for request status
create type message_request_status as enum ('pending', 'accepted', 'blocked');

-- 2) Message requests table
create table public.message_requests (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid not null,
    recipient_id uuid not null,
    initial_message text not null,
    status message_request_status not null default 'pending',
    conversation_id uuid references public.conversations(id) on delete set null,
    block_until timestamptz,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint message_request_sender_not_recipient check (sender_id <> recipient_id)
);

comment on table public.message_requests is 'Tracks initial message requests and gating state before conversations open.';

-- 3) Helpful indexes
create index message_requests_recipient_idx on public.message_requests (recipient_id, status, created_at desc);
create index message_requests_sender_idx on public.message_requests (sender_id, created_at desc);

-- Prevent multiple active requests (pending or accepted) between the same pair
create unique index message_requests_unique_active
on public.message_requests (sender_id, recipient_id)
where status in ('pending', 'accepted');

-- 4) Trigger to maintain updated_at
create or replace function public.touch_message_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_message_requests_updated_at
before update on public.message_requests
for each row execute procedure public.touch_message_requests_updated_at();

-- 5) Function: send_message_request
create or replace function public.send_message_request(p_sender uuid, p_recipient uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last record;
  v_request_id uuid;
begin
  if p_sender is null or p_recipient is null then
    raise exception 'Sender and recipient are required';
  end if;

  if p_sender = p_recipient then
    raise exception 'You cannot message yourself';
  end if;

  -- Check last request status between this pair
  select id, status, block_until
    into v_last
    from public.message_requests
   where sender_id = p_sender
     and recipient_id = p_recipient
   order by created_at desc
   limit 1;

  if v_last.status is not null then
    if v_last.status = 'pending' then
      raise exception 'A message request is already pending.';
    elsif v_last.status = 'accepted' then
      raise exception 'You already have an open conversation with this user.';
    elsif v_last.status = 'blocked' and v_last.block_until is not null and v_last.block_until > now() then
      raise exception 'Your request was declined. You can try again after %.', v_last.block_until;
    end if;
  end if;

  insert into public.message_requests (sender_id, recipient_id, initial_message)
  values (p_sender, p_recipient, p_content)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- 6) Function: accept_message_request -> ensures conversation exists and unlocks messaging
create or replace function public.accept_message_request(p_request_id uuid, p_recipient uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.message_requests%rowtype;
  v_conversation_id uuid;
begin
  select * into v_req from public.message_requests where id = p_request_id;
  if not found then
    raise exception 'Message request not found';
  end if;

  if v_req.recipient_id <> p_recipient then
    raise exception 'You can only act on requests sent to you';
  end if;

  if v_req.status <> 'pending' then
    raise exception 'Request is not pending';
  end if;

  -- Find existing conversation if any
  select id into v_conversation_id
    from public.conversations
   where (user1_id = v_req.sender_id and user2_id = v_req.recipient_id)
      or (user1_id = v_req.recipient_id and user2_id = v_req.sender_id)
   limit 1;

  if v_conversation_id is null then
    insert into public.conversations (user1_id, user2_id)
    values (v_req.sender_id, v_req.recipient_id)
    returning id into v_conversation_id;
  end if;

  update public.message_requests
     set status = 'accepted',
         conversation_id = v_conversation_id,
         resolved_at = now(),
         block_until = null,
         updated_at = now()
   where id = p_request_id;

  return v_conversation_id;
end;
$$;

-- 7) Function: reject_message_request -> blocks sender for 30 days
create or replace function public.reject_message_request(p_request_id uuid, p_recipient uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.message_requests%rowtype;
  v_block_until timestamptz := now() + interval '30 days';
begin
  select * into v_req from public.message_requests where id = p_request_id;
  if not found then
    raise exception 'Message request not found';
  end if;

  if v_req.recipient_id <> p_recipient then
    raise exception 'You can only act on requests sent to you';
  end if;

  if v_req.status <> 'pending' then
    raise exception 'Request is not pending';
  end if;

  update public.message_requests
     set status = 'blocked',
         block_until = v_block_until,
         resolved_at = now(),
         updated_at = now()
   where id = p_request_id;

  return v_block_until;
end;
$$;
