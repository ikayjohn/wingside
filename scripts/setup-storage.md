# Setting Up Supabase Storage for Product Images

To enable image uploads for products, you need to create a storage bucket in Supabase.

## Steps:

### 1. Go to Supabase Dashboard

Navigate to: https://supabase.com/dashboard

### 2. Select Your Project

Select the `wingside` project

### 3. Go to Storage

Click on **Storage** in the left sidebar

### 4. Create New Bucket

1. Click **"New bucket"** button
2. Fill in the details:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Check this box** (important!)
   - **File size limit**: Leave as default (50MB) or set to 5MB
   - **Allowed MIME types**: Leave as default or set to: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

3. Click **"Create bucket"**

### 5. Set Bucket Policies (Important!)

By default, the bucket might not allow uploads. You need to set the correct policies:

1. Click on your `product-images` bucket
2. Click on **"Policies"** tab at the top
3. Click **"New Policy"**
4. Choose **"For full customization"**

#### Policy 1: Allow Authenticated Users to Upload

```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
```

#### Policy 2: Allow Public Read Access

```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

#### Policy 3: Allow Authenticated Users to Update

```sql
CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');
```

#### Policy 4: Allow Admins to Delete

```sql
CREATE POLICY "Allow admins to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);
```

### 6. Verify Setup

Once you've created the bucket and policies:

1. The bucket should appear in your Storage list
2. The bucket should show as **Public**
3. You should see the policies listed under the Policies tab

### 7. Test Upload

After setup, go to your admin products page:

1. Navigate to `http://localhost:3000/admin/products`
2. Click **"+ Add New Product"** or edit an existing product
3. Click on the image upload area
4. Select an image from your computer
5. The image should upload and you'll see a success message
6. The image preview will update with your new image

## Troubleshooting

### Upload fails with "Permission denied"
- Make sure you're logged in as an admin user
- Check that the policies are set correctly
- Verify the bucket is marked as **Public**

### Upload fails with "Bucket not found"
- Make sure the bucket name is exactly `product-images`
- Refresh your page and try again

### Images don't display after upload
- Check that the "Allow public read access" policy is set
- Verify the bucket is marked as **Public**
- Check browser console for any errors

## Notes

- Uploaded images are automatically given unique filenames to prevent conflicts
- Image URLs will look like: `https://[your-project].supabase.co/storage/v1/object/public/product-images/product-[timestamp]-[random].jpg`
- Max file size is 5MB (configured in the API endpoint)
- Accepted formats: JPG, JPEG, PNG, WEBP, GIF
- Old images in `/public` folder will still work fine!

## Alternative: Keep Using Local Images

If you prefer to keep using local images in the `/public` folder:

1. Simply don't create the storage bucket
2. Continue manually adding images to `/public` folder
3. Use the "Manual URL" input in the form: `/order-product-name.jpg`
4. The upload button won't work but manual URLs will still work perfectly

Both methods work - choose what's best for you!
