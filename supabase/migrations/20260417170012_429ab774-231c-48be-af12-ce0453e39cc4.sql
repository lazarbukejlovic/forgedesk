-- Promote current user to admin
insert into public.user_roles (user_id, role)
values ('c952e228-beb7-481e-b114-5507f729cc90', 'admin')
on conflict do nothing;

-- Product images storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read for product-images
create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

-- Admin write for product-images
create policy "product_images_admin_insert"
on storage.objects for insert
with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

create policy "product_images_admin_update"
on storage.objects for update
using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

create policy "product_images_admin_delete"
on storage.objects for delete
using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));