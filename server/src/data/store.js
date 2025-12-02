const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_PATH = path.join(__dirname, 'wishlists.json');

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ wishlists: [] }, null, 2));
  }
};

const loadData = () => {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
};

const saveData = (data) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
};

const createWishlist = ({ ownerName, title }) => {
  const data = loadData();
  const newWishlist = {
    id: randomUUID(),
    ownerName,
    title,
    items: [],
    createdAt: new Date().toISOString(),
  };
  data.wishlists.push(newWishlist);
  saveData(data);
  return newWishlist;
};

const addItem = (wishlistId, item) => {
  const data = loadData();
  const wishlist = data.wishlists.find((w) => w.id === wishlistId);
  if (!wishlist) {
    throw new Error('Wishlist not found');
  }
  const newItem = {
    id: randomUUID(),
    name: item.name,
    description: item.description || '',
    link: item.link || '',
    isReserved: false,
    reservedBy: null,
    createdAt: new Date().toISOString(),
  };
  wishlist.items.push(newItem);
  saveData(data);
  return newItem;
};

const reserveItem = (wishlistId, itemId, reserverName) => {
  const data = loadData();
  const wishlist = data.wishlists.find((w) => w.id === wishlistId);
  if (!wishlist) {
    throw new Error('Wishlist not found');
  }
  const item = wishlist.items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  if (item.isReserved) {
    throw new Error('Item already reserved');
  }
  item.isReserved = true;
  item.reservedBy = reserverName || 'Anonymous';
  item.reservedAt = new Date().toISOString();
  saveData(data);
  return item;
};

const getWishlist = (wishlistId) => {
  const data = loadData();
  return data.wishlists.find((w) => w.id === wishlistId) || null;
};

const listWishlists = () => {
  const data = loadData();
  return data.wishlists.map(({ id, ownerName, title, createdAt }) => ({
    id,
    ownerName,
    title,
    createdAt,
  }));
};

module.exports = {
  createWishlist,
  addItem,
  reserveItem,
  getWishlist,
  listWishlists,
};
