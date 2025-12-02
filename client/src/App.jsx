import { useEffect, useMemo, useState } from 'react';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const EmptyList = ({ label }) => (
  <p style={{ color: '#475569', margin: '8px 0' }}>No {label} yet.</p>
);

const ItemList = ({ items, onReserve, allowReserve }) => (
  <ul className="list">
    {items.map((item) => (
      <li key={item.id} className="list-item">
        <div className="flex-between">
          <h4>{item.name}</h4>
          {typeof item.isReserved !== 'undefined' && (
            <span className={`pill ${item.isReserved ? 'status-reserved' : 'status-available'}`}>
              {item.isReserved ? 'Reserved' : 'Available'}
            </span>
          )}
        </div>
        {item.description && <p style={{ margin: '6px 0' }}>{item.description}</p>}
        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer">
            View link
          </a>
        )}
        {item.reservedBy && (
          <small>Reserved by {item.reservedBy}</small>
        )}
        {allowReserve && !item.isReserved && (
          <button style={{ marginTop: 8 }} onClick={() => onReserve(item.id)}>
            Reserve this item
          </button>
        )}
      </li>
    ))}
  </ul>
);

function App() {
  const [createForm, setCreateForm] = useState({ ownerName: '', title: '' });
  const [newWishlistId, setNewWishlistId] = useState('');
  const [itemForm, setItemForm] = useState({ wishlistId: '', name: '', description: '', link: '' });
  const [ownerViewId, setOwnerViewId] = useState('');
  const [publicViewId, setPublicViewId] = useState('');
  const [ownerWishlist, setOwnerWishlist] = useState(null);
  const [publicWishlist, setPublicWishlist] = useState(null);
  const [reserveName, setReserveName] = useState('');
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2600);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/wishlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to create wishlist');
      setNewWishlistId(data.wishlist.id);
      setItemForm((prev) => ({ ...prev, wishlistId: data.wishlist.id }));
      setOwnerViewId(data.wishlist.id);
      setPublicViewId(data.wishlist.id);
      showToast('Wishlist created! Share the public ID.');
      setCreateForm({ ownerName: '', title: '' });
      await loadWishlists();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    setError('');
    if (!itemForm.wishlistId) {
      setError('Provide a wishlist ID first.');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/wishlists/${itemForm.wishlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: itemForm.name, description: itemForm.description, link: itemForm.link }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to add item');
      showToast('Item added');
      setItemForm((prev) => ({ ...prev, name: '', description: '', link: '' }));
      if (ownerViewId) fetchOwnerWishlist(ownerViewId);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchOwnerWishlist = async (id) => {
    setError('');
    try {
      const res = await fetch(`${apiBase}/wishlists/${id}?viewer=owner`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not load wishlist');
      setOwnerWishlist(data.wishlist);
    } catch (err) {
      setError(err.message);
      setOwnerWishlist(null);
    }
  };

  const fetchPublicWishlist = async (id) => {
    setError('');
    try {
      const res = await fetch(`${apiBase}/wishlists/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not load public wishlist');
      setPublicWishlist(data.wishlist);
    } catch (err) {
      setError(err.message);
      setPublicWishlist(null);
    }
  };

  const reserveItem = async (itemId) => {
    if (!publicWishlist?.id) return;
    try {
      const res = await fetch(`${apiBase}/wishlists/${publicWishlist.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, reserverName: reserveName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to reserve');
      showToast('Item reserved!');
      fetchPublicWishlist(publicWishlist.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadWishlists = async () => {
    try {
      const res = await fetch(`${apiBase}/wishlists`);
      const data = await res.json();
      if (res.ok) setWishlists(data.wishlists);
    } catch (err) {
      // ignore list fetch errors for offline mode
    }
  };

  useEffect(() => {
    loadWishlists();
  }, []);

  const publicShareLink = useMemo(
    () => (publicViewId ? `${window.location.origin}?wishlist=${publicViewId}` : ''),
    [publicViewId],
  );

  return (
    <div>
      <header>
        <div>
          <p className="pill">Full-stack demo</p>
          <h1>Wishlist app</h1>
          <p>Create wishlists, share them, and let friends reserve gifts without the owner seeing reservations.</p>
        </div>
        {toast && <div className="pill status-available">{toast}</div>}
      </header>

      {error && (
        <div className="card" style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#991b1b' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="section-grid">
        <div className="card">
          <h3>Create a wishlist</h3>
          <form className="form-grid" onSubmit={handleCreate}>
            <label>
              Your name
              <input
                required
                placeholder="Alex"
                value={createForm.ownerName}
                onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
              />
            </label>
            <label>
              Wishlist title
              <input
                required
                placeholder="Birthday surprises"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create wishlist'}
            </button>
          </form>
          {newWishlistId && (
            <p style={{ marginTop: 10 }}>
              New wishlist ID: <strong>{newWishlistId}</strong>
            </p>
          )}
        </div>

        <div className="card">
          <h3>Add items</h3>
          <form className="form-grid" onSubmit={handleAddItem}>
            <label>
              Wishlist ID
              <input
                placeholder="Paste wishlist id"
                value={itemForm.wishlistId}
                onChange={(e) => setItemForm({ ...itemForm, wishlistId: e.target.value })}
              />
            </label>
            <label>
              Item name
              <input
                required
                placeholder="Noise cancelling headphones"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows={3}
                placeholder="Color, size, or notes"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </label>
            <label>
              Link
              <input
                placeholder="https://example.com/gift"
                value={itemForm.link}
                onChange={(e) => setItemForm({ ...itemForm, link: e.target.value })}
              />
            </label>
            <button type="submit">Add item</button>
          </form>
        </div>
      </div>

      <div className="section-grid">
        <div className="card">
          <div className="flex-between">
            <h3>Owner view</h3>
            <small>Reservations hidden from owners</small>
          </div>
          <div className="form-grid">
            <label>
              Wishlist ID
              <input
                placeholder="owner wishlist id"
                value={ownerViewId}
                onChange={(e) => setOwnerViewId(e.target.value)}
              />
            </label>
            <button onClick={() => fetchOwnerWishlist(ownerViewId)} disabled={!ownerViewId}>
              Load owner-safe view
            </button>
          </div>
          {ownerWishlist ? (
            <div>
              <p>
                Viewing <strong>{ownerWishlist.title}</strong> by {ownerWishlist.ownerName}
              </p>
              {ownerWishlist.items.length ? (
                <ItemList items={ownerWishlist.items} allowReserve={false} />
              ) : (
                <EmptyList label="items" />
              )}
            </div>
          ) : (
            <EmptyList label="owner items" />
          )}
        </div>

        <div className="card">
          <div className="flex-between">
            <h3>Guest view & reservations</h3>
            <small>See what is available to claim</small>
          </div>
          <div className="form-grid">
            <label>
              Public wishlist ID
              <input
                placeholder="shared wishlist id"
                value={publicViewId}
                onChange={(e) => setPublicViewId(e.target.value)}
              />
            </label>
            <label>
              Your name (optional)
              <input
                placeholder="Friend name"
                value={reserveName}
                onChange={(e) => setReserveName(e.target.value)}
              />
            </label>
            <button onClick={() => fetchPublicWishlist(publicViewId)} disabled={!publicViewId}>
              Load public wishlist
            </button>
            {publicShareLink && <small>Share link: {publicShareLink}</small>}
          </div>
          {publicWishlist ? (
            <div>
              <p>
                Viewing <strong>{publicWishlist.title}</strong> by {publicWishlist.ownerName}
              </p>
              {publicWishlist.items.length ? (
                <ItemList items={publicWishlist.items} allowReserve onReserve={reserveItem} />
              ) : (
                <EmptyList label="items" />
              )}
            </div>
          ) : (
            <EmptyList label="public items" />
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex-between">
          <h3>All wishlists</h3>
          <button onClick={loadWishlists}>Refresh</button>
        </div>
        {wishlists.length ? (
          <ul className="list">
            {wishlists.map((w) => (
              <li key={w.id} className="list-item">
                <div className="flex-between">
                  <div>
                    <h4>{w.title}</h4>
                    <small>Owner: {w.ownerName}</small>
                  </div>
                  <span className="pill">ID: {w.id}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyList label="wishlists" />
        )}
      </div>

      <footer>
        Backend: {apiBase} • Built with Express + Vite + React
      </footer>
    </div>
  );
}

export default App;
