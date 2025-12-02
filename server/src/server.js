const express = require('express');
const path = require('path');
const {
  createWishlist,
  addItem,
  reserveItem,
  getWishlist,
  listWishlists,
} = require('./data/store');

const app = express();
const PORT = process.env.PORT || 4000;

const corsMiddleware = (_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return next();
};

app.use(corsMiddleware);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/wishlists', (_req, res) => {
  res.json({ wishlists: listWishlists() });
});

app.post('/api/wishlists', (req, res) => {
  const { ownerName, title } = req.body;
  if (!ownerName || !title) {
    return res.status(400).json({ message: 'ownerName and title are required' });
  }
  const wishlist = createWishlist({ ownerName, title });
  return res.status(201).json({ wishlist });
});

const sanitizeItemsForOwner = (items) =>
  items.map(({ id, name, description, link, createdAt }) => ({
    id,
    name,
    description,
    link,
    createdAt,
  }));

app.get('/api/wishlists/:id', (req, res) => {
  const wishlist = getWishlist(req.params.id);
  if (!wishlist) {
    return res.status(404).json({ message: 'Wishlist not found' });
  }
  const { viewer } = req.query;
  let items = wishlist.items;
  if (viewer === 'owner') {
    items = sanitizeItemsForOwner(wishlist.items);
  }
  return res.json({
    wishlist: {
      id: wishlist.id,
      ownerName: wishlist.ownerName,
      title: wishlist.title,
      createdAt: wishlist.createdAt,
      items,
    },
  });
});

app.post('/api/wishlists/:id/items', (req, res) => {
  const { name, description, link } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }
  try {
    const newItem = addItem(req.params.id, { name, description, link });
    return res.status(201).json({ item: newItem });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

app.post('/api/wishlists/:id/reserve', (req, res) => {
  const { itemId, reserverName } = req.body;
  if (!itemId) {
    return res.status(400).json({ message: 'itemId is required' });
  }
  try {
    const updatedItem = reserveItem(req.params.id, itemId, reserverName);
    return res.json({ item: updatedItem });
  } catch (error) {
    const status = error.message.includes('already') ? 409 : 404;
    return res.status(status).json({ message: error.message });
  }
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${PORT}`);
});
