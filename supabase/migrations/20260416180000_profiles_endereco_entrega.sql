-- Endereço padrão de entrega (perfil): pré-preenche checkout; pedidos continuam com snapshot próprio.

alter table public.profiles
  add column if not exists telefone text,
  add column if not exists cep text,
  add column if not exists logradouro text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists uf text;

comment on column public.profiles.telefone is 'Telefone para entrega / contato (opcional até salvar endereço completo).';
comment on column public.profiles.cep is 'CEP apenas dígitos (8) quando preenchido.';
comment on column public.profiles.logradouro is 'Endereço padrão: logradouro.';
comment on column public.profiles.numero is 'Endereço padrão: número.';
comment on column public.profiles.complemento is 'Endereço padrão: complemento (opcional).';
comment on column public.profiles.bairro is 'Endereço padrão: bairro.';
comment on column public.profiles.cidade is 'Endereço padrão: cidade.';
comment on column public.profiles.uf is 'Endereço padrão: UF (2 letras).';
