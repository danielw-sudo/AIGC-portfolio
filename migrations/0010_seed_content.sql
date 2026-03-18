-- Seed sample content for onboarding
-- R2_PUBLIC_URL_PLACEHOLDER is replaced by setup.sh before execution

-- Sample tags
INSERT OR IGNORE INTO tags (slug, title) VALUES
  ('landscape', 'Landscape'),
  ('portrait', 'Portrait'),
  ('abstract', 'Abstract');

-- Sample gallery entries (images uploaded to R2 by setup.sh)
INSERT INTO entries (slug, title, prompt, description, image_key, image_url, width, height, mime_type, status, featured, source_type) VALUES
  ('sample-kittens', 'Garden Companions', 'a white kitten and a black kitten sitting together in a lush green garden, impressionist painting style, dappled light, wildflowers', 'Two kittens share a quiet moment in a sunlit garden — impressionist warmth in every brushstroke.', 'samples/sample-kittens.jpg', 'R2_PUBLIC_URL_PLACEHOLDER/samples/sample-kittens.jpg', 800, 473, 'image/jpeg', 'published', 1, 'sample'),
  ('sample-whale-ride', 'Sky Voyage', 'child riding a whale through blue sky with clouds, whimsical illustration, colored pencil, storybook art, joyful', 'A child soars across a crayon-blue sky on the back of a gentle whale — pure storybook wonder.', 'samples/sample-whale-ride.jpg', 'R2_PUBLIC_URL_PLACEHOLDER/samples/sample-whale-ride.jpg', 533, 800, 'image/jpeg', 'published', 1, 'sample'),
  ('sample-winter-village', 'Winter Stillness', 'winter landscape, snowy village with wooden cabins, pine trees, abstract brushstrokes, layered paint, blue and gold palette', 'Snow-covered cabins nestle among pines — layered brushstrokes dissolve the village into quiet abstraction.', 'samples/sample-winter-village.jpg', 'R2_PUBLIC_URL_PLACEHOLDER/samples/sample-winter-village.jpg', 800, 450, 'image/jpeg', 'published', 1, 'sample');

-- Tag sample entries
INSERT INTO entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM entries e, tags t
  WHERE e.slug = 'sample-kittens' AND t.slug = 'portrait';
INSERT INTO entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM entries e, tags t
  WHERE e.slug = 'sample-whale-ride' AND t.slug = 'abstract';
INSERT INTO entry_tags (entry_id, tag_id)
  SELECT e.id, t.id FROM entries e, tags t
  WHERE e.slug = 'sample-winter-village' AND t.slug = 'landscape';

-- Sample blog topic
INSERT OR IGNORE INTO blog_topics (slug, title) VALUES
  ('getting-started', 'Getting Started');

-- Welcome blog post
INSERT INTO blog_posts (slug, title, summary, body, status, featured) VALUES
  ('welcome-to-your-gallery', 'Welcome to Your Gallery',
   'Your AI art portfolio is live. Here''s how to make it yours.',
   '## You''re live!

Your portfolio is deployed and ready to go. Here''s what to do next:

### 1. Personalize your site
Head to **Admin → Site Config** to set your site name, tagline, and hero text.

### 2. Upload your first artwork
Go to **Admin → New Entry**, upload an image, and click **Analyze** to let AI generate a title, description, and tags automatically.

### 3. Write your first blog post
Visit **Admin → Blog → New Post** to share your creative process or thoughts on AI art.

### 4. Remove sample content
Once you''ve added your own work, use the onboarding checklist on the dashboard to remove these sample entries with one click.

---

*This post was created automatically. Feel free to edit or delete it.*',
   'published', 1);

-- Link blog post to topic
INSERT INTO blog_post_topics (post_id, topic_id)
  SELECT bp.id, bt.id FROM blog_posts bp, blog_topics bt
  WHERE bp.slug = 'welcome-to-your-gallery' AND bt.slug = 'getting-started';

-- Default site config (hero)
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_hero_title', 'your<span class="text-accent">gallery</span>'),
  ('site_hero_subtitle', 'AI-generated art with the prompts that made them. Your creative portfolio starts here.'),
  ('onboarding_seed_version', '1');
