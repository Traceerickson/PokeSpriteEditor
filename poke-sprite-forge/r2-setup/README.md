# Cloudflare R2 Setup

1. Create an R2 bucket named `poke-sprites` in your Cloudflare dashboard.
2. In your Worker project, bind the bucket using Wrangler:
   ```toml
   [[r2_buckets]]
   binding = "SPRITE_BUCKET"
   bucket_name = "poke-sprites"
   ```
3. To allow temporary public access, use presigned URLs returned from the Worker.
