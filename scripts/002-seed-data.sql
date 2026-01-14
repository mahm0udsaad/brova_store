-- Seed categories
INSERT INTO categories (id, name, image_url, product_count) VALUES
  ('hoodies', 'Hoodies', '/streetwear-hoodie-collection-dark-aesthetic.jpg', 3),
  ('joggers', 'Joggers', '/streetwear-joggers-pants-urban-style.jpg', 1),
  ('shorts', 'Shorts', '/streetwear-cargo-shorts-summer-style.jpg', 1),
  ('t-shirts', 'T-Shirts', '/graphic-tees-streetwear-collection.jpg', 2),
  ('accessories', 'Accessories', '/streetwear-caps-accessories-urban-fashion.jpg', 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  product_count = EXCLUDED.product_count;

-- Seed products
INSERT INTO products (id, name, price, category_id, gender, sizes, image_url, images, description) VALUES
  ('1', 'True Hoodie', 9750, 'hoodies', 'unisex', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '/black-streetwear-hoodie-with-graphics.jpg', ARRAY['/black-streetwear-hoodie-with-graphics.jpg', '/black-streetwear-hoodie-back-view.jpg', '/black-streetwear-hoodie-detail.jpg'], 'Premium streetwear hoodie crafted from soft cotton blend for ultimate comfort.'),
  ('2', 'Pleasant Cap', 7200, 'accessories', 'unisex', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '/black-streetwear-cap-with-embroidered-logo.jpg', ARRAY['/black-streetwear-cap-with-embroidered-logo.jpg', '/black-streetwear-cap-side-view.jpg', '/black-streetwear-cap-worn.jpg'], 'Made from premium materials, this cap is designed to keep you looking fresh.'),
  ('3', 'Urban Joggers', 8700, 'joggers', 'men', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '/beige-streetwear-jogger-pants.jpg', ARRAY['/beige-streetwear-jogger-pants.jpg', '/beige-streetwear-jogger-detail.jpg', '/beige-streetwear-jogger-worn.jpg'], 'Comfortable joggers with tapered fit for the modern streetwear look.'),
  ('4', 'Graphic Tee', 3800, 't-shirts', 'unisex', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '/black-graphic-tee-streetwear.png', ARRAY['/black-graphic-tee-streetwear.png', '/black-graphic-tee-back.jpg', '/black-graphic-tee-detail.jpg'], 'Bold graphic tee that makes a statement.'),
  ('5', 'Street Shorts', 5250, 'shorts', 'men', ARRAY['S', 'M', 'L', 'XL', 'XXL'], '/black-streetwear-cargo-shorts.jpg', ARRAY['/black-streetwear-cargo-shorts.jpg', '/black-streetwear-cargo-shorts-detail.jpg', '/black-streetwear-cargo-shorts-worn.jpg'], 'Relaxed fit cargo shorts perfect for summer vibes.'),
  ('6', 'Oversized Hoodie', 10350, 'hoodies', 'women', ARRAY['S', 'M', 'L', 'XL'], '/cream-oversized-hoodie-women-streetwear.jpg', ARRAY['/cream-oversized-hoodie-women-streetwear.jpg', '/cream-oversized-hoodie-back.jpg', '/cream-oversized-hoodie-detail.jpg'], 'Cozy oversized hoodie with dropped shoulders.'),
  ('7', 'Vintage Jacket', 12600, 'hoodies', 'women', ARRAY['S', 'M', 'L', 'XL'], '/vintage-brown-leather-jacket-women.jpg', ARRAY['/vintage-brown-leather-jacket-women.jpg', '/vintage-brown-leather-jacket-back.jpg', '/vintage-brown-leather-jacket-detail.jpg'], 'Vintage-inspired jacket with modern streetwear edge.'),
  ('8', 'Cropped Tee', 2950, 't-shirts', 'women', ARRAY['XS', 'S', 'M', 'L'], '/white-cropped-t-shirt-women-streetwear.jpg', ARRAY['/white-cropped-t-shirt-women-streetwear.jpg', '/white-cropped-t-shirt-back.jpg', '/white-cropped-t-shirt-worn.jpg'], 'Trendy cropped tee for a modern look.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  gender = EXCLUDED.gender,
  sizes = EXCLUDED.sizes,
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  description = EXCLUDED.description;
