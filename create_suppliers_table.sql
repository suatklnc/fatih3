-- Create suppliers table
create table if not exists public.suppliers (
  id uuid not null default gen_random_uuid(),
  name text not null,
  tax_number text,
  address text,
  phone text,
  email text,
  contact_person text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint suppliers_pkey primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.suppliers enable row level security;

-- Create policies (Adjust restrictiveness as needed)
create policy "Enable all access for all users" on public.suppliers
    as permissive for all
    to public
    using (true)
    with check (true);
