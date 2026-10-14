import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  Bell,
  Check,
  ChevronRight,
  CircleDot,
  Clipboard,
  Coins,
  Gamepad2,
  KeyRound,
  LockKeyhole,
  Link as LinkIcon,
  LogOut,
  Menu,
  Package,
  Pencil,
  Power,
  RefreshCw,
  Search,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  UserRound,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import type { AdminUser, Order, OrderStatus, OrderTrackingDetails, Product, PayoutRecord } from "./types";
import LoginPage from "./LoginPage";
import { api, clearAuthToken, hasAuthSession } from "./services/api";
import { initialFinancials } from "./data/mockData";

const currency = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat("en-US");

function getInitialAuthState(): boolean {
  return hasAuthSession();
}

function statusClass(status: string): string {
  return status.toLowerCase().replace(/[^a-z]+/g, "-");
}

function formatOrderStatus(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

function App() {
  const [authenticated, setAuthenticated] = useState(getInitialAuthState);
  const [operatorEmail, setOperatorEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL ?? "admin@classicstore.local");
  const [operatorRole, setOperatorRole] = useState<"ADMIN" | "VIEWER">("VIEWER");
  const [loginNotice, setLoginNotice] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [financialSummary, setFinancialSummary] = useState(initialFinancials);
  const [loadingData, setLoadingData] = useState(false);
  const [merchants, setMerchants] = useState<Array<{ id: string; name: string; contactEmail?: string; active: boolean; apiKeyLast4: string; createdAt: string }>>([]);
  const [merchantName, setMerchantName] = useState("");
  const [merchantEmail, setMerchantEmail] = useState("");
  const [revealedApiKey, setRevealedApiKey] = useState("");
  const [merchantBusy, setMerchantBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [toast, setToast] = useState("");
  const [revealedOrder, setRevealedOrder] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().slice(0, 10));
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutReference, setPayoutReference] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "VIEWER">("VIEWER");
  const [userBusy, setUserBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmNextPassword, setConfirmNextPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    setLoadingData(true);
    (async () => {
      try {
        const currentUser = await api.getCurrentUser();
        if (!active) return;
        const isAdmin = currentUser.role === "ADMIN";
        setOperatorEmail(currentUser.email);
        setOperatorRole(isAdmin ? "ADMIN" : "VIEWER");
        const [nextProducts, nextOrders, summary, nextMerchants, nextPayouts, nextUsers] = await Promise.all([
          api.getProducts(), api.getOrders(), api.getFinancialSummary(), api.getMerchants(), api.getPayouts(),
          isAdmin ? api.getUsers() : Promise.resolve([] as AdminUser[]),
        ]);
        if (!active) return;
        const paidOut = nextPayouts.reduce((sum, item) => sum + item.amount, 0);
        setProducts(nextProducts); setOrders(nextOrders);
        setFinancialSummary({ ...summary, paidOut, availableBalance: summary.totalEarned - paidOut });
        setMerchants(nextMerchants); setPayouts(nextPayouts); setAdminUsers(nextUsers);
      } catch (error) {
        if (active) showToast(error instanceof Error ? error.message : "Failed to load dashboard data");
      } finally {
        if (active) setLoadingData(false);
      }
    })();
    return () => { active = false; };
  }, [authenticated]);

  const queueOrders = useMemo(
    () => orders.filter((order) => ["pending", "processing", "partially_delivered", "invalid"].includes(order.status)),
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "completed"),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === "All" || order.status === filter;
      const matchesSearch =
        !normalized ||
        order.id.toLowerCase().includes(normalized) ||
        order.platform.toLowerCase().includes(normalized);
      return matchesFilter && matchesSearch;
    });
  }, [orders, search, filter]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const handleCopyLink = async (order: Order) => {
    const link = `${window.location.origin}/track/${order.trackId}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Tracking link copied");
    } catch {
      showToast("Could not access clipboard");
    }
  };

  const handleReveal = async (orderId: string) => {
    if (revealedOrder === orderId) { setRevealedOrder(null); return; }
    try {
      const credentials = await api.revealCredentials(orderId);
      setOrders(current => current.map(item => item.id === orderId ? { ...item, credentials } : item));
      setRevealedOrder(orderId);
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not reveal credentials"); }
  };

  const saveOrderUpdate = async (order: Order, status: string, deliveredQuantity: number, failureCode: string): Promise<Order | null> => {
    try {
      const updated = await api.updateOrderStatus(order.id, status, deliveredQuantity, failureCode || undefined);
      setOrders(current => current.map(item => item.id === order.id ? updated : item));
      const [nextProducts, summary, nextPayouts] = await Promise.all([api.getProducts(), api.getFinancialSummary(), api.getPayouts()]);
      const paidOut = nextPayouts.reduce((sum, item) => sum + item.amount, 0);
      setProducts(nextProducts); setPayouts(nextPayouts); setFinancialSummary({ ...summary, paidOut, availableBalance: summary.totalEarned - paidOut });
      setEditingOrder(null); showToast("Order updated successfully"); return updated;
    } catch (error) { showToast(error instanceof Error ? error.message : "Order status update failed"); return null; }
  };

  const addPayout = async () => {
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !payoutDate) { showToast("Enter a valid payout date and amount"); return; }
    try {
      const saved = await api.createPayout({ date: payoutDate, amount, reference: payoutReference.trim() || undefined, note: payoutNote.trim() || undefined });
      const next = [saved, ...payouts]; setPayouts(next);
      const paidOut = next.reduce((sum, item) => sum + item.amount, 0);
      setFinancialSummary(current => ({ ...current, paidOut, availableBalance: current.totalEarned - paidOut }));
      setPayoutAmount(""); setPayoutReference(""); setPayoutNote(""); showToast("Payout record added");
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not add payout"); }
  };

  const removePayout = async (id: string) => {
    try { await api.deletePayout(id); const next = payouts.filter(item => item.id !== id); setPayouts(next); const paidOut = next.reduce((sum, item) => sum + item.amount, 0); setFinancialSummary(current => ({ ...current, paidOut, availableBalance: current.totalEarned - paidOut })); }
    catch (error) { showToast(error instanceof Error ? error.message : "Could not remove payout"); }
  };

  const addAdminUser = async () => {
    if (!newUserEmail.trim() || newUserPassword.length < 12) { showToast("Enter an email and a password of at least 12 characters"); return; }
    setUserBusy(true);
    try {
      const created = await api.createUser(newUserEmail.trim(), newUserPassword, newUserRole);
      setAdminUsers(current => [created, ...current]); setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("VIEWER");
      showToast(`${created.role} user created successfully`);
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not create user"); }
    finally { setUserBusy(false); }
  };

  const toggleUserActive = async (user: AdminUser) => {
    setUserBusy(true);
    try {
      const updated = await api.setUserActive(user.id, !user.active);
      setAdminUsers(current => current.map(item => item.id === updated.id ? updated : item));
      showToast(updated.active ? "User enabled" : "User disabled");
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not update user"); }
    finally { setUserBusy(false); }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    setUserBusy(true);
    try {
      await api.deleteUser(user.id);
      setAdminUsers(current => current.filter(item => item.id !== user.id));
      showToast("User deleted");
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not delete user"); }
    finally { setUserBusy(false); }
  };

  const changeOwnPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nextPassword.length < 12) { showToast("New password must be at least 12 characters"); return; }
    if (nextPassword !== confirmNextPassword) { showToast("The new passwords do not match"); return; }
    setPasswordBusy(true);
    try {
      await api.changePassword(currentPassword, nextPassword);
      clearAuthToken(); setCurrentPassword(""); setNextPassword(""); setConfirmNextPassword("");
      setLoginNotice("Your password was changed. Sign in again with your new password."); setAuthenticated(false);
    } catch (error) { showToast(error instanceof Error ? error.message : "Could not change password"); }
    finally { setPasswordBusy(false); }
  };

  const saveProduct = async (next: Product) => {
    try {
      const saved = next.id ? await api.updateProduct(next) : await api.createProduct(next);
      const normalized = { ...saved, id: String(saved.id) };
      setProducts(current => next.id ? current.map(item => item.id === next.id ? normalized : item) : [normalized, ...current]);
      setSelectedProduct(null);
      showToast(next.id ? `${next.name} settings updated` : `${next.name} created`);
    } catch (error) { showToast(error instanceof Error ? error.message : "Product update failed"); }
  };

  if (!authenticated) {
    return <LoginPage notice={loginNotice} onLoginSuccess={() => { setLoginNotice(""); setOperatorRole("VIEWER"); setAuthenticated(true); }} />;
  }

  const trackMatch = window.location.pathname.match(/^\/track\/([^/]+)/);
  if (trackMatch) return <TrackOrderPage trackId={decodeURIComponent(trackMatch[1])} orders={orders} isAdmin={operatorRole === "ADMIN"} onBack={() => { window.location.assign("/"); }} onSaveUpdate={saveOrderUpdate} onReveal={handleReveal} revealedOrder={revealedOrder} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <button className="mobile-menu" onClick={() => setMobileNavOpen((value) => !value)} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
          <div className="brand-mark">CS</div>
          <div>
            <div className="eyebrow">CLASSIC STORE</div>
            <div className="brand-name">Classic Store Admin</div>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="connection-pill">
            <span className="pulse-dot" />
            Active Connection
          </div>
          <div className="user-chip">
            <span className="avatar"><UserRound size={15} /></span>
            <span className="user-email">{operatorEmail}</span>
            <span className="tag tag-muted">{operatorRole}</span>
          </div>
          <button
            className="icon-button"
            title="Sign out"
            aria-label="Sign out"
            onClick={() => {
              clearAuthToken();
              setOperatorRole("VIEWER");
              setAuthenticated(false);
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
          <div className="sidebar-title">CONTROL PANEL</div>
          <nav>
            <a className="nav-item active" href="#overview" onClick={() => setMobileNavOpen(false)}>
              <Gamepad2 size={17} /> Overview
            </a>
            <a className="nav-item" href="#products" onClick={() => setMobileNavOpen(false)}>
              <Package size={17} /> Products
            </a>
            <a className="nav-item" href="#orders" onClick={() => setMobileNavOpen(false)}>
              <ShoppingCart size={17} /> Orders
              <span className="nav-count">{queueOrders.length}</span>
            </a>
            <a className="nav-item" href="#merchants" onClick={() => setMobileNavOpen(false)}>
              <UserRound size={17} /> Merchants
            </a>
            <a className="nav-item" href="#finance" onClick={() => setMobileNavOpen(false)}>
              <Wallet size={17} /> Finance
            </a>
            <a className="nav-item" href="#users-security" onClick={() => setMobileNavOpen(false)}>
              <ShieldCheck size={17} /> Account & security
            </a>
          </nav>

          <div className="sidebar-status">
            <div className="mini-label">STORE STATUS</div>
            <div className="status-row"><span className="status-live" /> Live</div>
            <div className="sidebar-foot">v1.0.0 · supplier terminal</div>
          </div>
        </aside>

        <main className="content" id="overview">
          <section className="hero-grid">
            <div className="hero-card">
              <div className="hero-glow" />
              <div className="hero-copy">
                <div className="hero-kicker"><ShieldCheck size={15} /> SECURE OPERATOR CONSOLE</div>
                <h1>Run your store.<br /><span>Win the queue.</span></h1>
                <p>Manage live stock, fulfill assigned orders, and keep your gaming storefront moving.</p>
              </div>
              <div className="hero-metrics">
                <div className="metric">
                  <span>QUEUE</span>
                  <strong>{queueOrders.length.toString().padStart(2, "0")}</strong>
                </div>
                <div className="metric">
                  <span>COMPLETED</span>
                  <strong>{completedOrders.length.toString().padStart(2, "0")}</strong>
                </div>
                <div className="metric">
                  <span>BALANCE</span>
                  <strong>{currency.format(financialSummary.availableBalance)}</strong>
                </div>
              </div>
            </div>

            <section className="alert-card" aria-label="Telegram order alerts">
              <div className="section-icon"><Bell size={18} /></div>
              <div className="alert-main">
                <div className="section-heading-row">
                  <div>
                    <div className="section-title">Telegram order alerts</div>
                    <p>Get a notification when an order is assigned to you.</p>
                  </div>
                  <span className={`tag ${telegramConnected ? "tag-green" : "tag-muted"}`}>
                    {telegramConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                {operatorRole === "ADMIN" && <div className="inline-actions">
                  <button className="btn btn-primary" onClick={async () => { try { await api.sendTelegramTest(); showToast("Telegram test message sent"); } catch (error) { showToast(error instanceof Error ? error.message : "Telegram test failed"); } }}>
                    <Send size={15} /> Send test
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={async () => {
                      try {
                        if (telegramConnected) { await api.disconnectTelegram(); setTelegramConnected(false); showToast("Telegram disconnected"); }
                        else { await api.connectTelegram(); setTelegramConnected(true); showToast("Telegram connected"); }
                      } catch (error) { showToast(error instanceof Error ? error.message : "Telegram connection action failed"); }
                    }}
                  >
                    <Power size={15} /> {telegramConnected ? "Disconnect" : "Connect"}
                  </button>
                </div>}
              </div>
            </section>
          </section>

          <section id="products" className="section-block">
            <div className="section-header">
              <div>
                <div className="title-with-icon"><Package size={19} /><h2>Products & limits</h2></div>
                <p>Manage your active products, stock, and pricing bounds.</p>
              </div>
              <div className="inline-actions"><span className="section-count">{products.length} products</span>{operatorRole === "ADMIN" && <button className="btn btn-primary" onClick={() => setSelectedProduct({ id: "", productCode: "", name: "", status: "Online", availability: "Available", stockLimit: 1, stockQuantity: 0, pricePerMillion: 0, minCoins: 1, maxCoins: 1, currency: "EGP" })}><Package size={14} /> Add product</button>}</div>
            </div>

            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} canEdit={operatorRole === "ADMIN"} onEdit={() => setSelectedProduct(product)} />
              ))}
            </div>
          </section>

          <section id="orders" className="section-block">
            <div className="section-header order-header">
              <div>
                <div className="title-with-icon"><ShoppingCart size={19} /><h2>Order queue</h2></div>
                <p>Fulfill assigned orders and update their status.</p>
              </div>
              <div className="order-toolbar">
                <div className="search-box">
                  <Search size={15} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search order..."
                  />
                </div>
                <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filter orders">
                  <option value="All">All</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="partially_delivered">Partially delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                  <option value="invalid">Invalid</option>
                </select>
              </div>
            </div>

            <div className="order-board">
              <div className="order-summary-bar">
                <div className="summary-chip"><CircleDot size={13} /> {queueOrders.length} waiting</div>
                <div className="summary-chip"><Check size={13} /> {completedOrders.length} done</div>
                <div className="summary-chip"><Coins size={13} /> {currency.format(completedOrders.reduce((sum, order) => sum + order.earning, 0))} earned in listed orders</div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Platform</th>
                      <th>Credentials</th>
                      <th>Quantity</th>
                      <th>Earning</th>
                      <th>Status</th>
                      <th>Date & time</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {loadingData && <tr><td colSpan={8}>Loading orders…</td></tr>}
                    {!loadingData && filteredOrders.length === 0 && <tr><td colSpan={8}>No orders have been submitted yet.</td></tr>}
                    {filteredOrders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        revealed={revealedOrder === order.id}
                        canAdmin={operatorRole === "ADMIN"}
                        onReveal={() => handleReveal(order.id)}
                        onCopy={() => handleCopyLink(order)}
                        onUpdate={() => setEditingOrder(order)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="merchants" className="section-block">
            <div className="section-header">
              <div><div className="title-with-icon"><UserRound size={19} /><h2>Merchant access</h2></div><p>Manage merchant API keys. New keys are displayed only once.</p></div>
              <span className="section-count">{merchants.length} merchants</span>
            </div>
            {operatorRole === "ADMIN" && <div className="merchant-create-row">
              <input aria-label="Merchant name" placeholder="Merchant name" value={merchantName} onChange={event => setMerchantName(event.target.value)} />
              <input aria-label="Merchant contact email" type="email" placeholder="Contact email (optional)" value={merchantEmail} onChange={event => setMerchantEmail(event.target.value)} />
              <button className="btn btn-primary" disabled={merchantBusy || !merchantName.trim()} onClick={async () => {
                setMerchantBusy(true); setRevealedApiKey("");
                try { const created = await api.createMerchant(merchantName.trim(), merchantEmail.trim() || undefined); setMerchants(current => [created, ...current]); setRevealedApiKey(created.apiKey); setMerchantName(""); setMerchantEmail(""); showToast("Merchant created. Copy its API key now."); }
                catch (error) { showToast(error instanceof Error ? error.message : "Merchant creation failed"); }
                finally { setMerchantBusy(false); }
              }}>{merchantBusy ? "Saving…" : "Add merchant"}</button>
            </div>}
            {operatorRole === "ADMIN" && revealedApiKey && <div className="merchant-key-reveal"><div><strong>Copy this API key now</strong><code>{revealedApiKey}</code></div><button className="btn btn-outline" onClick={async () => { try { await navigator.clipboard.writeText(revealedApiKey); showToast("API key copied"); } catch { showToast("Could not access clipboard"); } }}>Copy key</button></div>}
            <div className="merchant-list">
              {merchants.length === 0 ? <div className="empty-history">No merchants registered yet.</div> : merchants.map(merchant => <div className="merchant-row" key={merchant.id}>
                <div className="merchant-name"><strong>{merchant.name}</strong><small>{merchant.contactEmail || "No contact email"}</small></div>
                <div className="merchant-key-suffix">•••• {merchant.apiKeyLast4}</div>
                <span className={`tag ${merchant.active ? "tag-green" : "tag-muted"}`}>{merchant.active ? "Active" : "Revoked"}</span>
                {operatorRole === "ADMIN" && <div className="merchant-actions">
                  <button className="btn btn-outline" disabled={merchantBusy || !merchant.active} onClick={async () => {
                    setMerchantBusy(true); try { const rotated = await api.rotateMerchantKey(merchant.id); setMerchants(current => current.map(item => item.id === rotated.id ? rotated : item)); setRevealedApiKey(rotated.apiKey); showToast("Key rotated. Copy the new key now."); } catch (error) { showToast(error instanceof Error ? error.message : "Key rotation failed"); } finally { setMerchantBusy(false); }
                  }}>Rotate key</button>
                  <button className="btn btn-ghost" disabled={merchantBusy} onClick={async () => {
                    setMerchantBusy(true); try { const updated = await api.setMerchantActive(merchant.id, !merchant.active); setMerchants(current => current.map(item => item.id === updated.id ? updated : item)); showToast(updated.active ? "Merchant reactivated" : "Merchant API key revoked"); } catch (error) { showToast(error instanceof Error ? error.message : "Merchant update failed"); } finally { setMerchantBusy(false); }
                  }}>{merchant.active ? "Revoke" : "Reactivate"}</button>
                </div>}
              </div>)}
            </div>
          </section>

          <section id="users-security" className="section-block">
            <div className="section-header">
              <div><div className="title-with-icon"><ShieldCheck size={19} /><h2>Account & security</h2></div><p>{operatorRole === "ADMIN" ? "Manage system users and your own sign-in password." : "Manage your own sign-in password."}</p></div>
              <span className="section-count">{operatorRole === "ADMIN" ? `${adminUsers.length} users` : operatorRole}</span>
            </div>
            <div className="user-security-grid">
              {operatorRole === "ADMIN" && <div className="user-management-card">
                <h3><UserPlus size={16} /> Add a system user</h3>
                <p>New users can sign in to the admin console with the credentials you assign.</p>
                <label>Email address<input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="operator@example.com" autoComplete="off" /></label>
                <label>Temporary password<input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="At least 12 characters" autoComplete="new-password" minLength={12} /></label>
                <label>User role<select value={newUserRole} onChange={e => setNewUserRole(e.target.value as "ADMIN" | "VIEWER")}><option value="VIEWER">VIEWER — view only</option><option value="ADMIN">ADMIN — full access</option></select></label>
                <button className="btn btn-primary" disabled={userBusy || !newUserEmail.trim() || newUserPassword.length < 12} onClick={addAdminUser}>{userBusy ? "Creating…" : "Create user"}</button>
              </div>}
              <form className="user-management-card" onSubmit={changeOwnPassword}>
                <h3><LockKeyhole size={16} /> Change my password</h3>
                <p>After a successful change, you will be signed out and must log in again.</p>
                <label>Current password<input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label>
                <label>New password<input type="password" value={nextPassword} onChange={e => setNextPassword(e.target.value)} autoComplete="new-password" minLength={12} required /></label>
                <label>Confirm new password<input type="password" value={confirmNextPassword} onChange={e => setConfirmNextPassword(e.target.value)} autoComplete="new-password" minLength={12} required /></label>
                <button className="btn btn-primary" type="submit" disabled={passwordBusy}>{passwordBusy ? "Updating…" : "Change password & sign out"}</button>
              </form>
            </div>
            {operatorRole === "ADMIN" && <div className="merchant-list admin-user-list">
              {adminUsers.length === 0 ? <div className="empty-history">No system users returned.</div> : adminUsers.map(user => <div className="merchant-row" key={user.id}>
                <div className="merchant-name"><strong>{user.email}</strong><small>Created {new Date(user.createdAt).toLocaleDateString()}</small></div>
                <span className="tag tag-muted">{user.role}</span>
                <span className={`tag ${user.active ? "tag-green" : "tag-muted"}`}>{user.active ? "Active" : "Disabled"}</span>
                <div className="merchant-actions">
                  <button className="btn btn-outline" disabled={userBusy || user.email.toLowerCase() === operatorEmail.toLowerCase()} onClick={() => toggleUserActive(user)}>{user.active ? "Disable" : "Enable"}</button>
                  <button className="btn btn-ghost" disabled={userBusy || user.email.toLowerCase() === operatorEmail.toLowerCase()} onClick={() => deleteUser(user)}>Delete</button>
                </div>
              </div>)}
            </div>}
          </section>

          <section id="finance" className="section-block finance-section">
            <div className="section-header">
              <div>
                <div className="title-with-icon"><Wallet size={19} /><h2>Financial summary</h2></div>
                <p>Your total earnings and payment history.</p>
              </div>
            </div>

            <div className="finance-grid">
              <FinanceCard label="Total earned" value={currency.format(financialSummary.totalEarned)} icon={<TrendingUp size={17} />} />
              <FinanceCard label="Paid out" value={currency.format(financialSummary.paidOut)} icon={<Wallet size={17} />} muted />
              <FinanceCard label="Available balance" value={currency.format(financialSummary.availableBalance)} icon={<Coins size={17} />} accent />
            </div>
            {operatorRole === "ADMIN" && <div className="payout-entry-panel">
              <h3>Record a payout</h3>
              <div className="payout-entry-grid">
                <label>Date<input type="date" value={payoutDate} onChange={e => setPayoutDate(e.target.value)} /></label>
                <label>Amount (EGP)<input type="number" min="0.01" step="0.01" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="0.00" /></label>
                <label>Reference<input value={payoutReference} onChange={e => setPayoutReference(e.target.value)} placeholder="Transfer reference" /></label>
                <label>Note<input value={payoutNote} onChange={e => setPayoutNote(e.target.value)} placeholder="Optional note" /></label>
                <button className="btn btn-primary" onClick={addPayout}><Check size={14}/> Add payout</button>
              </div>
            </div>}
            <div className="table-scroll payout-table-wrap"><table><thead><tr><th>Date</th><th>Reference</th><th>Note</th><th>Amount</th><th /></tr></thead><tbody>
              {payouts.map(item => <tr key={item.id}><td>{item.date}</td><td>{item.reference || "—"}</td><td>{item.note || "—"}</td><td>{currency.format(item.amount)}</td><td>{operatorRole === "ADMIN" && <button className="mini-action" title="Delete payout" onClick={() => removePayout(item.id)}><X size={14}/></button>}</td></tr>)}
              {payouts.length === 0 && <tr><td colSpan={5}>No payout records yet. Add a manual entry above.</td></tr>}
            </tbody></table></div>
          </section>
        </main>
      </div>

      {operatorRole === "ADMIN" && editingOrder && <OrderUpdateModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={saveOrderUpdate} />}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSave={saveProduct}
        />
      )}

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </div>
  );
}

function ProductCard({ product, onEdit, canEdit }: { product: Product; onEdit: () => void; canEdit: boolean }) {
  return (
    <article className={`product-card ${product.status === "Online" ? "product-online" : ""}`}>
      <div className="product-card-top">
        <div>
          <div className="product-name">{product.name}</div>
          <div className="tag-row">
            <span className={`tag ${product.status === "Online" ? "tag-green" : "tag-muted"}`}>
              {product.status}
            </span>
            <span className={`tag ${product.availability === "Available" ? "tag-lime" : "tag-muted"}`}>
              {product.availability}
            </span>
          </div>
        </div>
        {canEdit && <button className="btn btn-outline" onClick={onEdit}><Pencil size={14} /> Edit</button>}
      </div>
      <div className="product-stats">
        <Stat label="Stock limit" value={integer.format(product.stockLimit)} />
        <Stat label="Price per 1M" value={currency.format(product.pricePerMillion)} />
        <Stat label="Min coins" value={integer.format(product.minCoins)} />
        <Stat label="Max coins" value={integer.format(product.maxCoins)} />
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat-cell"><span>{label}</span><strong>{value}</strong></div>;
}

function OrderRow({
  order,
  revealed,
  onReveal,
  onCopy,
  onUpdate,
  canAdmin,
}: {
  order: Order;
  revealed: boolean;
  canAdmin: boolean;
  onReveal: () => void;
  onCopy: () => void;
  onUpdate: () => void;
}) {
  return (
    <tr className={order.status === "completed" ? "row-done" : ""}>
      <td>
        <div className="order-id">{order.externalOrderId ?? order.id}</div>
        <div className="order-sub">supplier order</div>
      </td>
      <td><span className="platform-badge">{order.platform}</span></td>
      <td>
        {canAdmin ? <>
          <button className="reveal-btn" onClick={onReveal}>
            <KeyRound size={13} />
            {revealed ? "Hide" : "Reveal"}
          </button>
          {revealed && (
            <div className="credentials-popover">
              <span>{order.credentials?.username ?? order.customerEmail ?? "Customer"}</span>
              <span>{order.credentials?.password ?? "••••••••••"}</span>
              {order.credentials?.backupCodes?.map(code => <span key={code}>{code}</span>)}
            </div>
          )}
        </> : <span className="track-muted">Admin only</span>}
      </td>
      <td>
        <div className="quantity-main">{integer.format(order.quantity)}</div>
        <div className="delivered">{integer.format(order.delivered)} del.</div>
      </td>
      <td><span className="earning">{currency.format(order.earning)}</span></td>
      <td><span className={`status-pill status-${statusClass(order.status)}`}>{formatOrderStatus(order.status)}</span></td>
      <td>
        <div className="date-cell">
          <span>{order.dateTime.split(" ").slice(0, 3).join(" ")}</span>
          <small>{order.dateTime.split(" ").slice(3).join(" ")}</small>
        </div>
      </td>
      <td>
        <div className="row-actions">
          <button className="mini-action" title="Track order" onClick={() => window.location.assign(`/track/${order.trackId}`)}>
            <Activity size={14} />
          </button>
          <button className="mini-action" title="Copy track link" onClick={onCopy}>
            <Clipboard size={14} />
          </button>
          {canAdmin && <button className="mini-action mini-action-primary" title="Update status" onClick={onUpdate}>
            <ChevronRight size={15} />
          </button>}
        </div>
      </td>
    </tr>
  );
}

function FinanceCard({
  label,
  value,
  icon,
  muted,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`finance-card ${muted ? "finance-muted" : ""} ${accent ? "finance-accent" : ""}`}>
      <div className="finance-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const [draft, setDraft] = useState(product);

  const updateNumber = (key: keyof Product, value: string) => {
    setDraft((current) => ({ ...current, [key]: Number(value) }));
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">PRODUCT CONFIG</div>
            <h3>{product.name || "New product"}</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="form-grid">
          {!product.id && <label><span>Product code (API identifier)</span><input value={draft.productCode ?? ""} onChange={event => setDraft(current => ({ ...current, productCode: event.target.value.trim().toLowerCase() }))} placeholder="ps/xb" /></label>}
          <label>
            <span>Stock limit</span>
            <input type="number" min="1" value={draft.stockLimit} onChange={(event) => { const value = Number(event.target.value); setDraft(current => ({ ...current, stockLimit: value, maxCoins: value })); }} />
          </label>
          <label>
            <span>Price per 1M</span>
            <input type="number" step="0.01" value={draft.pricePerMillion} onChange={(event) => updateNumber("pricePerMillion", event.target.value)} />
          </label>
          <label>
            <span>Min coins</span>
            <input type="number" value={draft.minCoins} onChange={(event) => updateNumber("minCoins", event.target.value)} />
          </label>
          <label>
            <span>Max coins</span>
            <input type="number" min="1" value={draft.maxCoins} onChange={(event) => { const value = Number(event.target.value); setDraft(current => ({ ...current, maxCoins: value, stockLimit: value })); }} />
          </label>
        </div>

        <div className="toggle-row">
          <div>
            <strong>Online</strong>
            <small>Accept assignments for this product</small>
          </div>
          <button
            className={`switch ${draft.status === "Online" ? "switch-on" : ""}`}
            onClick={() =>
              setDraft((current) => ({
                ...current,
                status: current.status === "Online" ? "Offline" : "Online",
                availability: current.status === "Online" ? "Unavailable" : "Available",
              }))
            }
            aria-label="Toggle online status"
          >
            <span />
          </button>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(draft)}><Check size={15} /> Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default App;


const ORDER_STATUSES = ["pending", "processing", "partially_delivered", "completed", "cancelled", "refunded", "invalid"];
const FAILURE_CODES = ["", "WRONG_EMAIL_OR_PASSWORD", "WRONG_BACKUP_CODES", "CAPTCHA_REQUIRED", "LOGIN_VERIFICATION_DISABLED", "CUSTOMER_ONLINE", "CONSOLE_IN_USE", "TRANSFER_MARKET_LOCKED", "TRANSFER_MARKET_FULL", "UNASSIGNED_LIST_FULL", "INSUFFICIENT_COINS", "USER_NOT_FOUND", "CLUB_NOT_FOUND", "MULTIPLE_CLUBS", "WRONG_CONSOLE", "WAITING_24_HOURS", "EA_SERVERS_UNAVAILABLE", "STOPPED_BY_ADMIN", "TECHNICAL_ISSUE"];
function OrderUpdateModal({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (order: Order, status: string, delivered: number, failureCode: string) => void }) {
  const [status, setStatus] = useState(order.status);
  const [delivered, setDelivered] = useState(String(order.delivered));
  const [failureCode, setFailureCode] = useState(order.failureCode ?? "");
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={e => e.stopPropagation()}>
    <div className="modal-header"><div><div className="eyebrow">ORDER CONTROL</div><h3>Update {order.externalOrderId ?? order.id}</h3></div><button className="icon-button" onClick={onClose}><X size={18}/></button></div>
    <div className="form-grid"><label><span>Status</span><select value={status} onChange={e => setStatus(e.target.value)}>{ORDER_STATUSES.map(v => <option key={v} value={v}>{v.replaceAll("_", " ")}</option>)}</select></label>
    <label><span>Delivered quantity (max {integer.format(order.quantity)})</span><input type="number" min={order.delivered} max={order.quantity} value={delivered} onChange={e => setDelivered(e.target.value)}/></label>
    <label className="form-span-all"><span>Failure code</span><select value={failureCode} onChange={e => setFailureCode(e.target.value)}>{FAILURE_CODES.map(v => <option key={v} value={v}>{v || "None"}</option>)}</select></label></div>
    <div className="modal-actions"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave(order, status, Number(delivered), failureCode)}>Save update</button></div>
  </div></div>;
}
function TrackOrderPage({ trackId, orders, isAdmin, onBack, onSaveUpdate, onReveal, revealedOrder }: {
  trackId: string;
  orders: Order[];
  isAdmin: boolean;
  onBack: () => void;
  onSaveUpdate: (order: Order, status: string, delivered: number, failureCode: string) => Promise<Order | null>;
  onReveal: (id: string) => void;
  revealedOrder: string | null;
}) {
  const order = orders.find(o => o.trackId === trackId || o.externalOrderId === trackId || o.id === trackId);
  const [currentBalance, setCurrentBalance] = useState("");
  const [beforeImage, setBeforeImage] = useState("");
  const [afterImage, setAfterImage] = useState("");
  const [trades, setTrades] = useState(Array.from({ length: 10 }, (_, i) => ({ purchase: "", sale: "", index: i + 1 })));
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [trackingNotice, setTrackingNotice] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [showOrderUpdate, setShowOrderUpdate] = useState(false);
  const [orderUpdateBusy, setOrderUpdateBusy] = useState(false);
  const [orderUpdateError, setOrderUpdateError] = useState("");
  const netTotal = trades.reduce((sum, t) => sum + Math.floor((Number(t.sale) || 0) * .95) - (Number(t.purchase) || 0), 0);

  useEffect(() => {
    if (!order) return;
    let active = true;
    setTrackingLoading(true); setTrackingError("");
    api.getOrderTracking(order.id).then(details => {
      if (!active) return;
      setCurrentBalance(details.currentCoinsBalance == null ? "" : String(details.currentCoinsBalance));
      setBeforeImage(details.beforeImageData ?? ""); setAfterImage(details.afterImageData ?? "");
      setTrades(Array.from({ length: 10 }, (_, i) => {
        const saved = details.trades.find(t => t.rowNumber === i + 1);
        return { index: i + 1, purchase: saved?.purchase == null ? "" : String(saved.purchase), sale: saved?.sale == null ? "" : String(saved.sale) };
      }));
    }).catch(error => {
      if (active) setTrackingError(error instanceof Error ? error.message : "Could not load order tracking details");
    }).finally(() => { if (active) setTrackingLoading(false); });
    return () => { active = false; };
  }, [order?.id]);

  const upload = (file: File | undefined, setter: (value: string) => void) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) {
      setTrackingError("Choose JPG, PNG or WEBP under 10 MB"); return;
    }
    const reader = new FileReader();
    reader.onload = () => { setter(String(reader.result)); setTrackingError(""); setTrackingNotice("Image selected. Save tracking details to persist it."); };
    reader.onerror = () => setTrackingError("Could not read the selected image");
    reader.readAsDataURL(file);
  };

  const saveTrackingDetails = async () => {
    if (!order) return;
    setTrackingSaving(true); setTrackingNotice(""); setTrackingError("");
    try {
      const payload: Omit<OrderTrackingDetails, "orderId" | "trades"> & { trades: Array<Omit<OrderTrackingDetails["trades"][number], "net">> } = {
        currentCoinsBalance: currentBalance.trim() === "" ? null : Number(currentBalance),
        beforeImageData: beforeImage || null,
        afterImageData: afterImage || null,
        trades: trades.map(t => ({
          rowNumber: t.index,
          purchase: t.purchase.trim() === "" ? null : Number(t.purchase),
          sale: t.sale.trim() === "" ? null : Number(t.sale),
        })),
      };
      const saved = await api.saveOrderTracking(order.id, payload);
      setCurrentBalance(saved.currentCoinsBalance == null ? "" : String(saved.currentCoinsBalance));
      setBeforeImage(saved.beforeImageData ?? ""); setAfterImage(saved.afterImageData ?? "");
      setTrades(Array.from({ length: 10 }, (_, i) => {
        const item = saved.trades.find(t => t.rowNumber === i + 1);
        return { index: i + 1, purchase: item?.purchase == null ? "" : String(item.purchase), sale: item?.sale == null ? "" : String(item.sale) };
      }));
      setTrackingNotice("Tracking details saved to the backend.");
    } catch (error) {
      setTrackingError(error instanceof Error ? error.message : "Could not save tracking details");
    } finally { setTrackingSaving(false); }
  };

  const handleOrderUpdate = async (updatedOrder: Order, status: string, delivered: number, failureCode: string) => {
    setOrderUpdateBusy(true); setOrderUpdateError("");
    try {
      const saved = await onSaveUpdate(updatedOrder, status, delivered, failureCode);
      if (saved) { setShowOrderUpdate(false); setTrackingNotice("Order status, delivery quantity and failure code updated."); }
      else setOrderUpdateError("The order could not be updated. Check the dashboard notification and try again.");
    } catch (error) {
      setOrderUpdateError(error instanceof Error ? error.message : "Order update failed");
    } finally { setOrderUpdateBusy(false); }
  };

  return <div className="track-page"><header className="track-topbar"><div className="brand-mark">CS</div><div><div className="eyebrow">CLASSIC STORE</div><h1>Order {order?.externalOrderId ?? trackId}</h1></div><button className="btn btn-outline" onClick={onBack}>Back to dashboard</button></header>
    {!order ? <div className="track-card"><h2>{trackingLoading ? "Loading order…" : "Order not found"}</h2><p>{trackingLoading ? "Loading the order details from the backend." : "This order is not available in the current admin session."}</p><button className="btn btn-primary" onClick={onBack}>Return to dashboard</button></div> : <div className="track-layout"><main className="track-main">
      <section className="track-card"><div className="track-section-heading"><h2>ORDER CONTROL</h2>{isAdmin && <button className="btn btn-primary" onClick={() => { setOrderUpdateError(""); setShowOrderUpdate(true); }}><Pencil size={14}/> Update order</button>}</div><div className="track-metrics"><div><small>STATUS</small><strong>{formatOrderStatus(order.status)}</strong></div><div><small>QUANTITY</small><strong>{integer.format(order.quantity)}</strong></div><div><small>DELIVERED</small><strong>{integer.format(order.delivered)}</strong></div><div><small>NET EARNING</small><strong>{currency.format(order.earning)}</strong></div></div><div className="track-progress"><span style={{width: `${Math.min(100, order.quantity ? order.delivered / order.quantity * 100 : 0)}%`}}/></div><p>{order.failureCode ? `Failure code: ${order.failureCode}` : "No failure code recorded"}</p>{order.failureMessage && <p>{order.failureMessage}</p>}</section>
      <section className="track-card"><div className="track-section-heading"><h2>TRANSACTION LEDGER</h2><span className="track-muted">10 trade records</span></div>
        <label className="current-balance-field"><span>CURRENT COINS BALANCE</span><input type="number" min="0" step="1" value={currentBalance} disabled={!isAdmin} onChange={e => setCurrentBalance(e.target.value)} placeholder="Enter current coins balance" /></label>
        <div className="table-scroll"><table><thead><tr><th>#</th><th>Trade purchase</th><th>Trade sale</th><th>Net</th></tr></thead><tbody>{trades.map((t, i) => <tr key={t.index}><td>#{String(t.index).padStart(2,"0")}</td><td><input aria-label={`Trade ${t.index} purchase`} type="number" min="0" step="1" value={t.purchase} disabled={!isAdmin} onChange={e => setTrades(curr => curr.map((x,j) => i === j ? {...x,purchase:e.target.value}:x))}/></td><td><input aria-label={`Trade ${t.index} sale`} type="number" min="0" step="1" value={t.sale} disabled={!isAdmin} onChange={e => setTrades(curr => curr.map((x,j) => i === j ? {...x,sale:e.target.value}:x))}/></td><td className="ledger-net">{integer.format(Math.floor((Number(t.sale)||0)*.95)-(Number(t.purchase)||0))}</td></tr>)}</tbody></table></div><div className="ledger-footer"><span>* Net formula: floor(Sale × 0.95) − Purchase</span><strong>Net total: {integer.format(netTotal)}</strong></div>
        <div className="tracking-save-row">{isAdmin && <button className="btn btn-primary" disabled={trackingSaving || trackingLoading} onClick={saveTrackingDetails}><Save size={14}/>{trackingSaving ? "Saving…" : "Save tracking details"}</button>}{trackingLoading && <span>Loading saved details…</span>}{!isAdmin && <span className="track-muted">Read-only access</span>}</div>
        {trackingNotice && <div className="tracking-notice" role="status">{trackingNotice}</div>}{trackingError && <div className="tracking-error" role="alert">{trackingError}</div>}
      </section>
    </main><aside className="track-side"><section className="track-card"><h2>EVIDENCE</h2>{([ ["Before State",beforeImage,setBeforeImage], ["After State",afterImage,setAfterImage] ] as const).map(([label,src,setter]) => <div className="evidence-block" key={label}><strong>{label}</strong>{src ? <img src={src} alt={label}/> : <div className="evidence-empty">No image provided</div>}{isAdmin && <label className="btn btn-outline upload-button">Upload Image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => upload(e.target.files?.[0],setter)}/></label>}</div>)}<small>{isAdmin ? "Accepted JPG, PNG, WEBP (max 10 MB). Save tracking details to persist uploads." : "Evidence images are view-only for this role."}</small></section>
      <section className="track-card"><h2>ORDER INFO</h2><dl><dt>Email</dt><dd>{order.customerEmail ?? "—"}</dd><dt>Platform</dt><dd>{order.platform}</dd><dt>Placed</dt><dd>{order.dateTime}</dd><dt>Failure code</dt><dd>{order.failureCode ?? "—"}</dd></dl></section>
      <section className="track-card supplier-card"><h2>SUPPLIER ACCESS</h2><p>{isAdmin ? "Supplier credentials are protected and requested from the backend only when revealed." : "Supplier credentials are restricted to administrators."}</p>{isAdmin && <button className="btn btn-outline" onClick={() => onReveal(order.id)}>{revealedOrder === order.id ? "Credentials loaded" : "Reveal credentials"}</button>}{isAdmin && revealedOrder === order.id && <div className="track-credentials"><p>{order.credentials?.username ?? order.customerEmail}</p><p>{order.credentials?.password ?? "••••••••"}</p>{order.credentials?.backupCodes?.map(c => <p key={c}>{c}</p>)}</div>}</section>
    </aside></div>}
    {isAdmin && showOrderUpdate && order && <OrderUpdateModal order={order} onClose={() => setShowOrderUpdate(false)} onSave={handleOrderUpdate} />}
    {orderUpdateBusy && <div className="tracking-busy" role="status">Saving order update…</div>}
    {orderUpdateError && <div className="tracking-error track-floating-error" role="alert">{orderUpdateError}</div>}
  </div>;
}
