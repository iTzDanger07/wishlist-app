# Wishlist App

Full-stack example for sharing wishlists. The backend is a Node.js + Express API that stores wishlists on disk, and the frontend is a React app built with Vite.

## Features
- Create wishlists with a title and owner name.
- Add items with notes and optional purchase links.
- Share a public wishlist ID so friends can view and reserve items.
- Owner view hides reservation details so surprises stay secret.

## Project structure
```
wishlist-app/
├── server/        # Express API
└── client/        # React + Vite frontend
```

## Running the API
1. `cd server`
2. `npm install`
3. `npm run dev`

The API listens on `http://localhost:4000` by default.

## Running the frontend
1. `cd client`
2. `npm install`
3. `npm run dev`

The UI expects `http://localhost:4000/api`. You can override this by setting `VITE_API_URL` in a `.env` file inside `client/`.

## Notes
- Wishlist data is stored in `server/src/data/wishlists.json` for simplicity.
- Reservation fields are removed from the owner-facing API responses to keep purchases hidden.
