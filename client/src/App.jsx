import { useEffect, useMemo, useState } from 'react';

import { ArrowDownRight, ArrowRight, ChevronLeft, ChevronRight, Menu, ShoppingBag, X, Plus, Minus, Trash2, Package, LogOut, RefreshCw, UploadCloud, Image as ImageIcon, ShieldCheck, CreditCard, LockKeyhole, CheckCircle2 } from 'lucide-react';

import { demoProducts } from './data/products';



const API = (import.meta.env.VITE_API_URL || 'http://10.85.196.148:5000/api').replace(/\/$/, '');

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

const ORDER_STATUSES = ['Pending confirmation', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];



function Artwork({ name = 'URBAN CAT' }) {

  const [first, second = ''] = name.split(' ');

  return <svg viewBox="0 0 240 260" fill="none" aria-hidden="true"><path d="M75 38 96 25H144L165 38 207 65 185 105 163 91V226H77V91L55 105 33 65 75 38Z" fill="#171717" stroke="#777" strokeWidth="1.5"/><path d="M96 25C99 43 141 43 144 25" stroke="#555" strokeWidth="4"/><text x="120" y="124" fill="#f5f5f5" fontSize="18" fontWeight="900" textAnchor="middle">{first.slice(0, 10)}</text><text x="120" y="145" fill="#f5f5f5" fontSize="18" fontWeight="900" textAnchor="middle">{second.slice(0, 10)}</text><path d="M95 156H145" stroke="#888"/></svg>;

}

const EDITORIAL_IMAGES = [

  'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1000&q=85',

  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=85',

  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85',

  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1000&q=85',

];

function getDiscountedPrice(product) {
  const price = Number(product?.price || 0);
  const discount = Math.min(100, Math.max(0, Number(product?.discountPercent || 0)));
  return Math.round(price * (1 - discount / 100) * 100) / 100;
}

function ProductPrice({ product, className = '' }) {
  const original = Number(product?.price || 0);
  const discount = Math.min(100, Math.max(0, Number(product?.discountPercent || 0)));
  const discounted = getDiscountedPrice(product);
  return <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
    <span className={discount > 0 ? 'font-semibold text-white' : 'text-white/65'}>₹{(discount > 0 ? discounted : original).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
    {discount > 0 && <>
      <span className="text-xs text-white/45 line-through">₹{original.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      <span className="border border-[#d9ff7a]/35 bg-[#d9ff7a]/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#d9ff7a]">SAVE {discount}%</span>
    </>}
  </div>;
}

function ProductImage({ product, index = 0, onClick }) {

  const fallback = EDITORIAL_IMAGES[index % EDITORIAL_IMAGES.length];

  return <button type="button" onClick={onClick} aria-label={`View ${product.name} product gallery`} className="product-placeholder group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden text-left">

    {product.badge && <span className="product-badge absolute left-3 top-3 z-10">{product.badge}</span>}
    {Number(product.discountPercent || 0) > 0 && <span className="absolute right-3 top-3 z-10 border border-[#d9ff7a]/50 bg-black/90 px-2 py-1 text-[10px] font-bold tracking-wider text-[#d9ff7a]">-{Math.min(100, Math.max(0, Number(product.discountPercent)))}%</span>}

    <img src={product.image || fallback} alt={product.name} className="h-full w-full object-cover" loading="lazy" onError={(e) => { if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback; }} />

    <span className="product-image-caption">VIEW GALLERY ↗</span>

  </button>;

}

function Field({ label, ...props }) { return <label className="block"><span className="field-label">{label}</span><input className="input" {...props} /></label>; }



export default function App() {

  const [products, setProducts] = useState(demoProducts);

  const [usingDemo, setUsingDemo] = useState(true);

  const [category, setCategory] = useState('All');

  const [cart, setCart] = useState([]);

  const [variantProduct, setVariantProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [recommendedPage, setRecommendedPage] = useState(0);
  const [previewZoomed, setPreviewZoomed] = useState(false);
  const [policyView, setPolicyView] = useState('');

  const [selectedSize, setSelectedSize] = useState('M');

  const [selectedColour, setSelectedColour] = useState('Black');

  const [drawer, setDrawer] = useState(window.location.pathname === '/owner/login' && !sessionStorage.getItem('uc-admin-token') ? 'admin' : '');

  const [toast, setToast] = useState('');

  const [orderResult, setOrderResult] = useState(null);

  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');

  const [trackingPhone, setTrackingPhone] = useState('');

  const [trackingResult, setTrackingResult] = useState(null);

  const [trackingError, setTrackingError] = useState('');

  const [trackingBusy, setTrackingBusy] = useState(false);

  const [showTracking, setShowTracking] = useState(false);

  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' });

  const [adminToken, setAdminToken] = useState(sessionStorage.getItem('uc-admin-token') || '');

  const [adminUser, setAdminUser] = useState(sessionStorage.getItem('uc-admin-user') || '');
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);

  const [adminTab, setAdminTab] = useState('products');

  const [adminProducts, setAdminProducts] = useState([]);

  const [orders, setOrders] = useState([]);

  const [login, setLogin] = useState({ username: '', password: '' });



const [customerAuthOpen, setCustomerAuthOpen] = useState(false);

const [customerAuthMode, setCustomerAuthMode] = useState('login');

const [customerAuthForm, setCustomerAuthForm] = useState({

  name: '',

  email: '',

  password: '',

});

const [customerAuthBusy, setCustomerAuthBusy] = useState(false);

const [customerAuthMessage, setCustomerAuthMessage] = useState('');

const [customerAccount, setCustomerAccount] = useState(

  () => {

    try {

      return JSON.parse(sessionStorage.getItem('uc-customer') || 'null');

    } catch {

      return null;

    }

  }

);

const [customerToken, setCustomerToken] = useState(

  () => sessionStorage.getItem('uc-customer-token') || ''

);


const [customerDashboardOpen, setCustomerDashboardOpen] = useState(false);
const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
const [customerView, setCustomerView] = useState('overview');
const [myOrders, setMyOrders] = useState([]);
const [myOrdersLoading, setMyOrdersLoading] = useState(false);
const [myOrdersError, setMyOrdersError] = useState('');



  const [productForm, setProductForm] = useState({ name: '', description: '', category: 'Graphic', price: '', discountPercent: '0', image: '', galleryImages: [], sizes: 'S, M, L, XL', colours: 'Black, White', badge: '', published: true });

  const [editingId, setEditingId] = useState('');

  const [busy, setBusy] = useState(false);

  const [adminMessage, setAdminMessage] = useState('');

  const [imageUploading, setImageUploading] = useState(false);

  const [imagePreviewError, setImagePreviewError] = useState(false);



  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);

  const filteredProducts = useMemo(() => category === 'All' ? products : products.filter((p) => p.category === category), [products, category]);
  const recommendedProducts = useMemo(() => products.filter((item) => item._id !== previewProduct?._id && item.published !== false), [products, previewProduct]);
  const recommendedPageSize = 4;
  const recommendedPageCount = Math.ceil(recommendedProducts.length / recommendedPageSize);
  const visibleRecommendedProducts = recommendedProducts.slice(recommendedPage * recommendedPageSize, (recommendedPage + 1) * recommendedPageSize);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.discountedPrice ?? item.price) * item.quantity, 0);
  const cartOriginalTotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,0);

  const cartSavings = cartOriginalTotal - cartTotal;


  async function loadProducts() {

    try {

      const response = await fetch(`${API}/products`);

      if (!response.ok) throw new Error('API not ready');

      const data = await response.json();

      setProducts(data);

      setUsingDemo(false);

    } catch { setProducts(demoProducts); setUsingDemo(true); }

  }

  useEffect(() => { loadProducts(); }, []);

  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 3200); return () => clearTimeout(id); }, [toast]);



  function openProductPreview(product, navigate = true) {
    if (navigate && product?._id) {
      const url = new URL(window.location.href);
      url.searchParams.set('product', String(product._id));
      window.history.pushState({ productId: String(product._id) }, '', url);
    }
    setPreviewProduct(product);
    setPreviewImageIndex(0);
    setRecommendedPage(0);
    setPreviewZoomed(false);
    const sizes = Array.isArray(product.sizes) ? product.sizes : String(product.sizes || 'S, M, L, XL').split(',').map((s) => s.trim()).filter(Boolean);
    const colours = Array.isArray(product.colours) ? product.colours : String(product.colours || 'Black, White').split(',').map((c) => c.trim()).filter(Boolean);
    setSelectedSize(sizes.includes('M') ? 'M' : (sizes[0] || 'M'));
    setSelectedColour(colours.includes('Black') ? 'Black' : (colours[0] || 'Black'));
  }

  function closeProductPreview() {
    if (new URL(window.location.href).searchParams.has('product')) {
      window.history.back();
    } else {
      setPreviewProduct(null);
    }
  }

  useEffect(() => {
    const syncProductFromUrl = () => {
      const productId = new URL(window.location.href).searchParams.get('product');
      if (!productId) {
        setPreviewProduct(null);
        return;
      }
      const match = products.find((item) => String(item._id) === productId);
      if (match) openProductPreview(match, false);
    };
    window.addEventListener('popstate', syncProductFromUrl);
    syncProductFromUrl();
    return () => window.removeEventListener('popstate', syncProductFromUrl);
  }, [products]);

  function addPreviewToCart() {
    if (!previewProduct) return;
    const product = previewProduct;
    const key = `${product._id}-${selectedSize}-${selectedColour}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      return existing
        ? current.map((item) => item.key === key ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item)
        : [...current, { key, productId: product._id, name: product.name, price: Number(product.price || 0), discountedPrice: getDiscountedPrice(product), discountPercent: Number(product.discountPercent || 0), image: product.image || '', quantity: 1, size: selectedSize, colour: selectedColour }];
    });
    closeProductPreview();
    setToast(`${product.name} · ${selectedSize} · ${selectedColour} added to bag`);
  }

  function buyPreviewNow() {
    if (!previewProduct) return;
    const product = previewProduct;
    const key = `${product._id}-${selectedSize}-${selectedColour}`;
    setCart([{ key, productId: product._id, name: product.name, price: Number(product.price || 0), discountedPrice: getDiscountedPrice(product), discountPercent: Number(product.discountPercent || 0), image: product.image || '', quantity: 1, size: selectedSize, colour: selectedColour }]);
    closeProductPreview();
    setDrawer('checkout');
  }

  function openVariantSelector(product) {

    const sizes = Array.isArray(product.sizes) ? product.sizes : String(product.sizes || 'S, M, L, XL').split(',').map((s) => s.trim()).filter(Boolean);

    const colours = Array.isArray(product.colours) ? product.colours : String(product.colours || 'Black, White').split(',').map((s) => s.trim()).filter(Boolean);

    setVariantProduct(product);

    setSelectedSize(sizes.includes('M') ? 'M' : (sizes[0] || 'M'));

    setSelectedColour(colours.includes('Black') ? 'Black' : (colours[0] || 'Black'));

  }

  function addToCart() {

    if (!variantProduct) return;

    const product = variantProduct;

    const key = `${product._id}-${selectedSize}-${selectedColour}`;

    setCart((current) => {

      const existing = current.find((item) => item.key === key);

      return existing

        ? current.map((item) => item.key === key ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item)

        : [...current, { key, productId: product._id, name: product.name, price: Number(product.price || 0), discountedPrice: getDiscountedPrice(product), discountPercent: Number(product.discountPercent || 0), image: product.image || '', quantity: 1, size: selectedSize, colour: selectedColour }];

    });

    setVariantProduct(null);

    setToast(`${product.name} · ${selectedSize} · ${selectedColour} added to bag`);

  }

  function changeQty(key, delta) { setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0 && item.quantity <= 20)); }



  async function submitOrder(event) {

    event.preventDefault();

    if (usingDemo) { setToast('Add products in the owner dashboard before accepting orders.'); return; }

    setCheckoutBusy(true);

    try {

      
const response = await fetch(`${API}/orders`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(customerToken
      ? { Authorization: `Bearer ${customerToken}` }
      : {})
  },
  body: JSON.stringify({
    customer,
    items: cart.map(({ productId, quantity, size, colour }) => ({
      productId,
      quantity,
      size,
      colour
    }))
  })
});


      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Could not submit order.');

      setOrderResult(data); setCart([]); setDrawer(''); setToast('Order submitted successfully.');

      setCustomer({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' });

    } catch (error) { setToast(error.message); }

    finally { setCheckoutBusy(false); }

  }



  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const existing = document.querySelector('script[data-razorpay-checkout]');
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpayCheckout = 'true';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function payWithRazorpay(event) {
    event.preventDefault();
    if (usingDemo) { setToast('Connect the database and load real products before accepting payments.'); return; }
    if (!cart.length) { setToast('Your bag is empty.'); return; }
    setCheckoutBusy(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Secure checkout could not load. Check your connection and try again.');
      const response = await fetch(`${API}/orders/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}) },
        body: JSON.stringify({
          customer,
          items: cart.map(({ productId, quantity, size, colour }) => ({ productId, quantity, size, colour }))
        })
      });
      const paymentOrder = await response.json();
      if (!response.ok) throw new Error(paymentOrder.message || 'Could not start secure checkout.');

      let verificationStarted = false;
      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || 'INR',
        name: 'URBAN CAT',
        description: `Streetwear order ${paymentOrder.orderNumber}`,
        order_id: paymentOrder.razorpayOrderId,
        image: '/URBAN-LOGO.png',
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        notes: { orderNumber: paymentOrder.orderNumber },
        theme: { color: '#d9ff7a', backdrop_color: '#080808' },
        modal: { ondismiss: () => { setCheckoutBusy(false); if (!verificationStarted) setToast('Checkout closed. Your bag is still saved.'); } },
        handler: async (gatewayResponse) => {
          verificationStarted = true;
          try {
            const verifyResponse = await fetch(`${API}/orders/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}) },
              body: JSON.stringify({ orderNumber: paymentOrder.orderNumber, ...gatewayResponse })
            });
            const verified = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(verified.message || 'We could not verify this payment yet. Contact support before paying again if money was deducted.');
            setOrderResult({ ...verified, paymentStatus: 'paid' });
            setCart([]);
            setDrawer('');
            setCustomer({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' });
            setToast('Payment verified. Your order is confirmed!');
          } catch (error) {
            setToast(error.message || 'Payment verification failed. Please contact support if money was deducted.');
          } finally {
            setCheckoutBusy(false);
          }
        }
      });
      checkout.on('payment.failed', (failure) => {
        setCheckoutBusy(false);
        setToast(failure?.error?.description || 'Payment failed. Your bag is still saved; you can try again.');
      });
      checkout.open();
    } catch (error) {
      setToast(error.message || 'Unable to start payment. Please try again.');
      setCheckoutBusy(false);
    }
  }

  async function trackOrder(event) {

  event.preventDefault();

  setTrackingBusy(true);

  setTrackingError('');

  setTrackingResult(null);



  try {

    const response = await fetch(`${API}/orders/track`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({

        orderNumber: trackingOrderNumber.trim(),

        phone: trackingPhone.trim(),

      }),

    });



    const data = await response.json();



    if (!response.ok) {

      throw new Error(data.message || 'Unable to find this order.');

    }



    setTrackingResult(data);

  } catch (error) {

    setTrackingError(

      error.message || 'Something went wrong. Please try again.'

    );

  } finally {

    setTrackingBusy(false);

  }

}



  async function adminFetch(path, options = {}) {

    const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}`, ...(options.headers || {}) } });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.message || 'Request failed.');

    return data;

  }

  async function doLogin(event) {

    event.preventDefault(); setBusy(true); setAdminMessage('');

    try {

      const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(login) });

      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Login failed.');

      setAdminToken(data.token); setAdminUser(data.username); sessionStorage.setItem('uc-admin-token', data.token); sessionStorage.setItem('uc-admin-user', data.username); setLogin({ username: '', password: '' }); setAdminMessage('Logged in.');

    } catch (error) { setAdminMessage(error.message); }

    finally { setBusy(false); }

  }







async function submitCustomerAuth(event) {

  event.preventDefault();

  setCustomerAuthBusy(true);

  setCustomerAuthMessage('');



  try {

    const response = await fetch(

      `${API}/customer-auth/${customerAuthMode}`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          name: customerAuthForm.name.trim(),

          email: customerAuthForm.email.trim(),

          password: customerAuthForm.password,

        }),

      }

    );



    const data = await response.json();



    if (!response.ok) {

      throw new Error(data.message || 'Authentication failed.');

    }



    const user = data.user;



    if (customerAuthMode === 'login' && user.role === 'owner') {

      // Owner session: use the token for protected dashboard APIs.

      sessionStorage.setItem('uc-admin-token', data.token);

      sessionStorage.setItem('uc-admin-user', user.name || user.email);



      // Clear any previous customer session.

      sessionStorage.removeItem('uc-customer-token');

      sessionStorage.removeItem('uc-customer');



      setAdminToken(data.token);

      setAdminUser(user.name || user.email);



      setCustomerToken('');

      setCustomerAccount(null);



      setCustomerAuthForm({

        name: '',

        email: '',

        password: '',

      });



      setCustomerAuthOpen(false);

      setToast(`Welcome, ${user.name || 'Owner'}!`);



      // Keep the storefront visible; owner tools are available in the sidebar.
      setDrawer('');
      setOwnerMenuOpen(false);
      window.history.pushState({}, '', '/');



      return;

    }



    sessionStorage.setItem('uc-customer-token', data.token);

    sessionStorage.setItem('uc-customer', JSON.stringify(user));



    setCustomerToken(data.token);

    setCustomerAccount(user);



    setCustomerAuthForm({

      name: '',

      email: '',

      password: '',

    });



    setCustomerAuthMessage(

      customerAuthMode === 'signup'

        ? 'Account created successfully!'

        : 'Login successful!'

    );



    setToast(

      `Welcome${user.name ? `, ${user.name}` : ''}!`

    );



    setCustomerAuthOpen(false);

  } catch (error) {

    setCustomerAuthMessage(

      error.message || 'Something went wrong. Please try again.'

    );

  } finally {

    setCustomerAuthBusy(false);

  }

}





function customerLogout() {

  sessionStorage.removeItem('uc-customer-token');

  sessionStorage.removeItem('uc-customer');

  setCustomerToken('');

  setCustomerAccount(null);

  setToast('You have been logged out.');

}


async function loadMyOrders() {
  if (!customerToken) {
    setMyOrdersError('Please log in to view your orders.');
    return;
  }

  setMyOrdersLoading(true);
  setMyOrdersError('');

  try {
    const response = await fetch(`${API}/orders/my-orders`, {
      headers: {
        Authorization: `Bearer ${customerToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not load your orders.');
    }

    setMyOrders(Array.isArray(data) ? data : []);
  } catch (error) {
    setMyOrdersError(error.message || 'Could not load your orders.');
  } finally {
    setMyOrdersLoading(false);
  }
}

function openCustomerDashboard(section = 'overview') {
  if (!customerAccount || !customerToken) {
    setCustomerAuthMode('login');
    setCustomerAuthMessage('Please log in to access your account.');
    setCustomerAuthOpen(true);
    return;
  }

  setCustomerView(section);
  setCustomerDashboardOpen(true);

  if (section === 'orders') {
    loadMyOrders();
  }
}



  async function loadAdminData() {

    setBusy(true); setAdminMessage('');

    try { const [ps, os] = await Promise.all([adminFetch('/products/admin/all'), adminFetch('/orders')]); setAdminProducts(ps); setOrders(os); }

    catch (error) { setAdminMessage(error.message); if (/log in|session expired/i.test(error.message)) logout(); }

    finally { setBusy(false); }

  }

  useEffect(() => { if (drawer === 'admin' && adminToken) loadAdminData(); }, [drawer, adminToken]);

  function logout() { setAdminToken(''); setAdminUser(''); sessionStorage.removeItem('uc-admin-token'); sessionStorage.removeItem('uc-admin-user'); setAdminProducts([]); setOrders([]); setDrawer(''); setOwnerMenuOpen(false); setToast('Owner logged out.'); }

  function startEdit(product) { setEditingId(product._id); setProductForm({ name: product.name || '', description: product.description || '', category: product.category || 'Graphic', price: String(product.price ?? ''), discountPercent: String(product.discountPercent ?? 0), image: product.image || '', galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [], sizes: (product.sizes || []).join(', '), colours: (product.colours || []).join(', '), badge: product.badge || '', published: Boolean(product.published) }); setAdminMessage(''); }

  function resetProductForm() { setEditingId(''); setProductForm({ name: '', description: '', category: 'Graphic', price: '', discountPercent: '0', image: '', galleryImages: [], sizes: 'S, M, L, XL', colours: 'Black, White', badge: '', published: true }); }

  async function uploadProductImage(event) {

    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {

      setAdminMessage('Image upload needs Cloudinary settings. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to client/.env, then restart the app.');

      return;

    }

    if (!file.type.startsWith('image/')) { setAdminMessage('Please choose an image file.'); return; }

    if (file.size > 8 * 1024 * 1024) { setAdminMessage('Please choose an image smaller than 8 MB.'); return; }

    setImageUploading(true); setAdminMessage('Uploading image…');

    try {

      const body = new FormData(); body.append('file', file); body.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); body.append('folder', 'urban-cat/products');

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body });

      const data = await response.json();

      if (!response.ok || !data.secure_url) throw new Error(data.error?.message || 'Image upload failed. Check your Cloudinary settings.');

      setProductForm((p) => ({ ...p, image: data.secure_url })); setImagePreviewError(false); setAdminMessage('Image uploaded. Save the product to keep this image URL.');

    } catch (error) { setAdminMessage(error.message || 'Image upload failed.'); }

    finally { setImageUploading(false); }

  }



  async function uploadGalleryImages(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setAdminMessage('Gallery upload needs Cloudinary settings in client/.env.'); return;
    }
    const existing = Array.isArray(productForm.galleryImages) ? productForm.galleryImages : [];
    const remaining = Math.max(0, 4 - existing.length);
    if (!remaining) { setAdminMessage('Maximum 4 gallery images allowed.'); return; }
    if (files.length > remaining) { setAdminMessage(`You can add ${remaining} more gallery image(s).`); return; }
    const invalid = files.find((file) => !file.type.startsWith('image/') || file.size > 8 * 1024 * 1024);
    if (invalid) { setAdminMessage('Choose image files smaller than 8 MB each.'); return; }

    setImageUploading(true); setAdminMessage('Uploading gallery images…');
    try {
      const uploaded = [];
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        body.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        body.append('folder', 'urban-cat/products/gallery');
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body });
        const data = await response.json();
        if (!response.ok || !data.secure_url) throw new Error(data.error?.message || 'Gallery image upload failed.');
        uploaded.push(data.secure_url);
      }
      setProductForm((p) => ({ ...p, galleryImages: [...(Array.isArray(p.galleryImages) ? p.galleryImages : []), ...uploaded] }));
      setAdminMessage('Gallery images uploaded. Save the product to keep them.');
    } catch (error) { setAdminMessage(error.message || 'Gallery image upload failed.'); }
    finally { setImageUploading(false); }
  }

  async function saveProduct(event) {

    event.preventDefault(); setBusy(true); setAdminMessage('');

    const payload = { ...productForm, price: Number(productForm.price), discountPercent: Number(productForm.discountPercent || 0), galleryImages: (Array.isArray(productForm.galleryImages) ? productForm.galleryImages : []).slice(0, 4), sizes: productForm.sizes.split(',').map((s) => s.trim()).filter(Boolean), colours: productForm.colours.split(',').map((s) => s.trim()).filter(Boolean) };

    try { await adminFetch(editingId ? `/products/${editingId}` : '/products', { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); await loadAdminData(); await loadProducts(); resetProductForm(); setAdminMessage('Product saved.'); }

    catch (error) { setAdminMessage(error.message); }

    finally { setBusy(false); }

  }

  async function deleteProduct(product) { if (!confirm(`Delete ${product.name}?`)) return; try { await adminFetch(`/products/${product._id}`, { method: 'DELETE' }); await loadAdminData(); await loadProducts(); setAdminMessage('Product deleted.'); } catch (error) { setAdminMessage(error.message); } }

  async function updateStatus(orderId, status) { try { await adminFetch(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await loadAdminData(); } catch (error) { setAdminMessage(error.message); } }



  function openOwnerSection(section) {
    setOwnerMenuOpen(false);
    if (section === 'store') {
      setDrawer('');
      window.history.pushState({}, '', '/');
      return;
    }
    if (section === 'add') {
      resetProductForm();
      setAdminTab('products');
    } else if (section === 'edit') {
      setAdminTab('products');
      resetProductForm();
    } else if (section === 'orders') {
      setAdminTab('orders');
    } else {
      setAdminTab('products');
    }
    setDrawer('admin');
  }

  return <div className={`min-h-screen bg-[#080808] text-white ${adminToken ? 'lg:pl-64' : ''}`}>
    {adminToken && <>
      {ownerMenuOpen && <button type="button" aria-label="Close owner menu overlay" className="fixed inset-0 z-[39] bg-black/70 lg:hidden" onClick={() => setOwnerMenuOpen(false)} />}
      <aside className={`${ownerMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0
      z-40 flex w-64 flex-col border-r border-white/10 bg-[#101010] p-5 transition-transform duration-200 lg:translate-x-0`}>
        <div className="mb-8 flex items-center justify-between">
          <div><img
  src="/URBAN-LOGO.png"
  alt="Urban Cat Clothing"
  className="mb-2 h-auto w-full max-w-[140px] object-contain"
/><p className="mt-1 text-[10px] tracking-[0.2em] text-white/40">OWNER PANEL</p></div>
          <button type="button" className="p-2 text-white/60 lg:hidden" aria-label="Close owner menu" onClick={() => setOwnerMenuOpen(false)}><X size={18}/></button>
        </div>
        <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/35">STORE MANAGEMENT</p>
        <nav className="space-y-2">
          <button type="button" onClick={() => openOwnerSection('add')} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"><Plus size={17}/> Add Product</button>
          <button type="button" onClick={() => openOwnerSection('edit')} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"><ImageIcon size={17}/> Edit Products</button>
          <button type="button" onClick={() => openOwnerSection('orders')} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"><ShoppingBag size={17}/> Orders</button>
        </nav>
        <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
          <button type="button" onClick={() => openOwnerSection('store')} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-white/65 hover:bg-white/10 hover:text-white"><ArrowRight size={17}/> View Store</button>
          <p className="truncate px-3 text-xs text-white/35">Signed in: {adminUser}</p>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-red-200/80 hover:bg-red-950/40 hover:text-red-100"><LogOut size={17}/> Log out</button>
        </div>
      </aside>
    </>}


    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/95 backdrop-blur"><div className="container-width flex h-[72px] items-center justify-between gap-4">{adminToken && <button type="button" className="p-2 lg:hidden" aria-label="Open owner menu" onClick={() => setOwnerMenuOpen(true)}><Menu size={21}/></button>}
<a
  href="#top"
  aria-label="Urban Cat home"
  className="flex shrink-0 items-center"
>
  <img
    src="/URBAN-LOGO.png"
    alt="URBAN CAT"
    className="h-12 w-12 object-contain transition-transform duration-200 hover:scale-105"
  />
  
<span className="ml-2 text-xl tracking-tight urban-brand-font">
  URBAN <span className="text-white/45">CAT.</span>
</span>

</a>
<nav className="hidden items-center gap-8 text-sm text-white/70 sm:flex"><a href="#shop" className="hover:text-white">Shop</a><a href="#new" className="hover:text-white">New arrivals</a>



<button

  type="button"

  

  onClick={() => {
  setCustomerAuthMessage('');
  setCustomerAuthMode('login');
  setCustomerAuthOpen(true);
}}  

  className="hover:text-white"

>

  {customerAccount?.name || 'Login'}

</button>

{customerAccount && (

  <button

    type="button"

    onClick={customerLogout}

    className="hover:text-white"

  >

    Logout

  </button>

)}





<a href="#about" className="hover:text-white">About</a></nav><div className="flex items-center gap-2"><button 
onClick={() => {
  if (customerAccount && customerToken) {
    openCustomerDashboard('overview');
  } else {
    setCustomerAuthMessage('');
    setCustomerAuthMode('login');
    setCustomerAuthOpen(true);
  }
}}
 className="bag-button flex items-center gap-2 border border-white/25 px-3 py-2 text-sm"><ShoppingBag size={17}/><span>{cartCount}</span></button></div></div></header>


{customerDashboardOpen && customerAccount && (
  <div className="fixed inset-0 z-[75] flex overflow-hidden bg-[#080808] text-white">
    {customerMenuOpen && (
      <button
        type="button"
        aria-label="Close customer navigation"
        className="fixed inset-0 z-[78] bg-black/70 md:hidden"
        onClick={() => setCustomerMenuOpen(false)}
      />
    )}
    <aside className={`${customerMenuOpen ? 'flex' : 'hidden md:flex'} absolute inset-y-0 left-0 z-[79] w-[min(84vw,320px)] shrink-0 flex-col border-r border-white/10 bg-[#101010] p-5 md:relative md:z-auto md:w-60 md:p-5`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
        
          <a href="#top" aria-label="Urban Cat home" className="block">
  <img
    src="/URBAN-LOGO.png"
    alt="Urban Cat Clothing"
    className="h-auto w-full max-w-[140px] object-contain"
  />
</a>
          <p className="mt-1 text-[10px] tracking-[0.2em] text-white/40">
            CUSTOMER ACCOUNT
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.matchMedia('(max-width: 767px)').matches) setCustomerMenuOpen(false);
            else setCustomerDashboardOpen(false);
          }}
          aria-label="Close customer menu"
          className="p-2 text-white/60 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <p className="mb-5 text-sm text-white/50">
        Hi, {customerAccount.name || 'Customer'}
      </p>

      <nav className="space-y-2">
        
{[
  ['overview', 'My Dashboard'],
  ['orders', 'My Orders'],
  ['wishlist', 'Wishlist'],
  ['track', 'Track Order']
].map(([section, label]) => (
  <button
    key={section}
    type="button"
    onClick={() => {
      setCustomerView(section);
      setCustomerMenuOpen(false);
      if (section === 'orders') loadMyOrders();
      if (section === 'track') {
        setTrackingResult(null);
        setTrackingError('');
      }
    }}
    className={`w-full px-3 py-3 text-left text-sm transition ${
      customerView === section
        ? 'bg-white text-black'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`}
  >
    {label}
  </button>
))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => {
            setCustomerDashboardOpen(false);
            setDrawer('cart');
          }}
          className="w-full px-3 py-3 text-left text-sm text-white/70 hover:bg-white/10"
        >
          My Cart ({cartCount})
        </button>

        <button
          type="button"
          onClick={() => setCustomerDashboardOpen(false)}
          className="w-full px-3 py-3 text-left text-sm text-white/70 hover:bg-white/10"
        >
          Continue Shopping
        </button>

        <button
          type="button"
          onClick={() => {
            setCustomerDashboardOpen(false);
            customerLogout();
          }}
          className="w-full px-3 py-3 text-left text-sm text-red-300 hover:bg-red-950/40"
        >
          Log Out
        </button>
      </div>
    </aside>

    <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-5 flex items-start justify-between gap-3 md:mb-0">
          <p className="pt-2 text-xs tracking-[0.2em] text-white/40">
            URBAN CAT / YOUR ACCOUNT
          </p>
          <button
            type="button"
            className="shrink-0 border border-white/25 p-3 text-white hover:bg-white hover:text-black md:hidden"
            aria-label="Open customer navigation"
            onClick={() => setCustomerMenuOpen(true)}
          >
            <Menu size={21} />
          </button>
        </div>
        <div className="hidden md:block">
          <p className="text-xs tracking-[0.2em] text-white/40">
          URBAN CAT / YOUR ACCOUNT
          </p>
        </div>

        {customerView === 'overview' && (
          <section className="mt-5">
            <h1 className="text-2xl font-black leading-tight sm:text-4xl">
              MY DASHBOARD.
            </h1>
            <p className="mt-3 text-sm text-white/60">
              Welcome back, {customerAccount.name || 'Customer'}.
              Manage your orders and shopping account here.
            </p>

            <button
              type="button"
              onClick={() => {
                setCustomerView('orders');
                loadMyOrders();
              }}
              className="mt-6 border border-white/30 px-5 py-3 text-sm hover:bg-white hover:text-black"
            >
              VIEW MY ORDERS →
            </button>
          </section>
        )}

        {customerView === 'orders' && (
          <section className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-black leading-tight sm:text-4xl">
                MY ORDERS.
              </h1>

              <button
                type="button"
                onClick={loadMyOrders}
                className="border border-white/25 px-4 py-2 text-sm hover:bg-white hover:text-black"
              >
                REFRESH
              </button>

            </div>

            {myOrdersLoading && (
              <p className="mt-6 text-sm text-white/60">
                Loading your orders...
              </p>
            )}

            {myOrdersError && (
              <p role="alert" className="mt-6 text-sm text-red-300">
                {myOrdersError}
              </p>
            )}

            {!myOrdersLoading && !myOrdersError && myOrders.length === 0 && (
              <div className="mt-6 border border-white/15 p-6">
                <p className="font-semibold">No account orders yet.</p>
                <p className="mt-2 text-sm text-white/50">
                  Orders placed while logged in will appear here.
                </p>
              </div>
            )}

            {!myOrdersLoading && !myOrdersError && myOrders.length > 0 && (
              <div className="mt-6 space-y-4">
                {[
                  {
                    title: 'RUNNING ORDERS',
                    statuses: [
                      'Pending confirmation',
                      'Confirmed',
                      'Printing',
                      'Shipped'
                    ]
                  },
                  {
                    title: 'DELIVERED',
                    statuses: ['Delivered']
                  },
                  {
                    title: 'CANCELLED',
                    statuses: ['Cancelled']
                  }
                ].map((group) => {
                  const groupOrders = myOrders.filter((order) =>
                    group.statuses.includes(order.status)
                  );

                  return (
                    <section key={group.title}>
                      <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-white/50">
                        {group.title} ({groupOrders.length})
                      </h2>

                      {groupOrders.length === 0 ? (
                        <p className="mb-5 text-sm text-white/35">
                          No orders in this section.
                        </p>
                      ) : (
                        <div className="mb-5 space-y-3">
                          {groupOrders.map((order) => (
                            <article
                              key={order.id || order._id}
                              className="border border-white/15 bg-[#101010] p-4 sm:p-5"
                            >
                              <div className="flex flex-wrap justify-between gap-3">
                                <div>
                                  <p className="break-all font-bold">
                                    {order.orderNumber}
                                  </p>
                                  <p className="mt-1 text-xs text-white/45">
                                    {order.createdAt
                                      ? new Date(order.createdAt).toLocaleDateString('en-IN')
                                      : ''}
                                  </p>
                                </div>

                                <span className="h-fit border border-white/20 px-3 py-2 text-xs">
                                  {order.status}
                                </span>
                              </div>

                              <div className="mt-4 space-y-2">
                                {(order.items || []).map((item, index) => (
                                  <p
                                    key={item.id || item._id || index}
                                    className="text-sm text-white/65"
                                  >
                                    {item.quantity} × {item.name}
                                    {' '}({item.size}, {item.colour})
                                  </p>
                                ))}
                              </div>

                              <p className="mt-4 border-t border-white/10 pt-3 text-sm font-bold">
                                Total: ₹{Number(order.total).toLocaleString('en-IN')}
                              </p>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {customerView === 'wishlist' && (
          <section className="mt-5">
            <h1 className="text-2xl font-black leading-tight sm:text-4xl">
              WISHLIST.
            </h1>
            <p className="mt-3 text-sm text-white/60">
              Wishlist saving is not connected yet. We'll add product saving next.
            </p>
          </section>
        )}

        
{customerView === 'track' && (
  <section className="mt-5">
    <h1 className="text-2xl font-black leading-tight sm:text-4xl">
      TRACK YOUR ORDER.
    </h1>

    <p className="mt-3 text-sm text-white/60">
      Enter your order number and checkout phone number.
    </p>

    <form onSubmit={trackOrder} className="mt-6 max-w-xl space-y-4">
      <Field
        label="Order number"
        value={trackingOrderNumber}
        onChange={(e) => setTrackingOrderNumber(e.target.value)}
        placeholder="Enter your order number"
        required
      />

      <Field
        label="Checkout phone number"
        type="tel"
        value={trackingPhone}
        onChange={(e) => setTrackingPhone(e.target.value)}
        placeholder="Phone number used at checkout"
        required
      />

      <button type="submit" className="button w-full" disabled={trackingBusy}>
        {trackingBusy ? 'CHECKING...' : 'TRACK ORDER'}
      </button>
    </form>

    {trackingError && (
      <p role="alert" className="mt-4 text-sm text-red-300">
        {trackingError}
      </p>
    )}

    {trackingResult && (
      <div className="mt-6 border border-white/15 p-5">
        <p className="text-xs text-white/45">
          ORDER {trackingResult.orderNumber}
        </p>
        <h2 className="mt-2 text-xl font-bold">{trackingResult.status}</h2>
        <p className="mt-2 text-sm text-white/60">
          Total: ₹{Number(trackingResult.total).toLocaleString('en-IN')}
        </p>

        <div className="mt-5 space-y-4">
          {(trackingResult.events || []).map((event, index) => (
            <div key={`${event.status}-${event.createdAt}-${index}`}
              className="border-l-2 border-white/30 pl-4">
              <p className="font-semibold">{event.status}</p>
              <p className="mt-1 text-xs text-white/50">{event.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          {(trackingResult.items || []).map((item, index) => (
            <p key={`${item.name}-${index}`} className="text-sm text-white/70">
              {item.quantity} × {item.name} ({item.size}, {item.colour})
            </p>
          ))}
        </div>
      </div>
    )}
  </section>
)}

      </div>
    </main>
  </div>
)}




{showTracking && (

  <section className="container-width py-10 sm:py-14">

    <div className="mx-auto max-w-2xl border border-white/15 bg-[#101010] p-5 sm:p-8">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-xs tracking-[0.25em] text-white/45">

            ORDER SUPPORT

          </p>

          <h2 className="mt-3 text-3xl font-black">

            TRACK YOUR ORDER.

          </h2>

          <p className="mt-3 text-sm text-white/60">

            Enter your order number and checkout phone number.

          </p>

        </div>



        <button

          type="button"

          onClick={() => setShowTracking(false)}

          className="text-sm text-white/60 hover:text-white"

        >

          Close

        </button>

      </div>



      <form onSubmit={trackOrder} className="mt-6 space-y-4">

        <Field

          label="Order number"

          value={trackingOrderNumber}

          onChange={(e) => setTrackingOrderNumber(e.target.value)}

          placeholder="Enter your order number"

          required

        />



        <Field

          label="Checkout phone number"

          type="tel"

          value={trackingPhone}

          onChange={(e) => setTrackingPhone(e.target.value)}

          placeholder="Phone number used at checkout"

          required

        />



        <button

          type="submit"

          className="button w-full"

          disabled={trackingBusy}

        >

          {trackingBusy ? 'CHECKING...' : 'TRACK ORDER'}

        </button>

      </form>



      {trackingError && (

        <p role="alert" className="mt-4 text-sm text-red-300">

          {trackingError}

        </p>

      )}



      {trackingResult && (

        <div className="mt-6 border-t border-white/10 pt-5">

          <p className="text-xs tracking-[0.2em] text-white/45">

            ORDER {trackingResult.orderNumber}

          </p>



          <h3 className="mt-2 text-2xl font-bold">

            {trackingResult.status}

          </h3>



          <p className="mt-2 text-sm text-white/60">

            Total: ₹{Number(trackingResult.total).toLocaleString('en-IN')}

          </p>



          <p className="mt-1 text-xs text-white/45">

            Placed: {trackingResult.createdAt

              ? new Date(trackingResult.createdAt).toLocaleString('en-IN')

              : '—'}

          </p>



          <div className="mt-5 space-y-4">

            {(trackingResult.events || []).map((event, index) => (

              <div

                key={`${event.status}-${event.createdAt}-${index}`}

                className="border-l-2 border-white/30 pl-4"

              >

                <p className="font-semibold">{event.status}</p>

                <p className="mt-1 text-xs text-white/50">{event.note}</p>

                <p className="mt-1 text-xs text-white/40">

                  {event.createdAt

                    ? new Date(event.createdAt).toLocaleString('en-IN')

                    : ''}

                </p>

              </div>

            ))}

          </div>



          <div className="mt-5 border-t border-white/10 pt-4">

            <h4 className="font-bold">Items</h4>

            <div className="mt-3 space-y-3">

              {(trackingResult.items || []).map((item, index) => (

                <div

                  key={`${item.name}-${index}`}

                  className="flex justify-between gap-3 text-sm"

                >

                  <span>

                    {item.quantity} × {item.name}

                    <span className="text-white/50">

                      {' '}({item.size}, {item.colour})

                    </span>

                  </span>

                  <span className="shrink-0">

                    ₹{(

                      Number(item.price) * Number(item.quantity)

                    ).toLocaleString('en-IN')}

                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

      )}

    </div>

  </section>

)}





    <section id="top" className="container-width py-4 sm:py-7"><div className="relative flex min-h-[440px] items-center overflow-hidden border border-white/10 bg-[#111] sm:min-h-[510px]"><div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 78% 42%, #3a3a3a 0%, #191919 34%, #080808 76%)' }}/><div className="hero-visual absolute inset-y-0 right-0 hidden w-[54%] items-center justify-center md:flex"><img className="hero-fashion-image" src={products[0]?.image || "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1400&q=90"} alt={products[0]?.name || "Urban streetwear editorial"} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1400&q=90"; }}/><div className="hero-image-shade"/><span className="absolute right-8 top-8 z-10 text-[10px] tracking-[0.3em]">UC / STREET DIVISION</span><span className="hero-image-index">DROP 001<br/>MADE FOR THE STREETS</span></div><div className="relative z-10 max-w-2xl p-6 sm:p-12"><p className="mb-5 text-xs font-bold tracking-[0.28em] text-white/60">INDEPENDENT STREETWEAR</p><h1 className="text-5xl font-black leading-[0.92] tracking-[-0.07em] sm:text-7xl lg:text-8xl">WEAR<br/>YOUR<br/><span className="text-white/45">OWN RULES.</span></h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/60 sm:text-base">Graphic statements. Everyday essentials. Made to move with you.</p><a href="#shop" className="mt-7 inline-flex items-center gap-5 bg-white px-6 py-3 text-xs font-bold tracking-wider text-black transition hover:bg-white/80">SHOP THE DROP <ArrowRight size={16}/></a></div><span className="absolute bottom-5 right-5 text-[10px] tracking-[0.2em] text-white/45">01 — NEW SEASON</span></div></section>



    <section id="shop" className="container-width py-10 sm:py-14"><div id="new" className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] tracking-[0.28em] text-white/45">CURATED FOR THE STREETS</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured collection<span className="text-white/35">.</span></h2></div><p className="text-[10px] tracking-widest text-white/45">{filteredProducts.length} DESIGNS</p></div>{usingDemo && <div className="mb-5 border border-white/15 px-4 py-3 text-xs leading-5 text-white/60">Preview mode: sample products are shown. Add products in the owner dashboard before accepting orders.</div>}<div className="mb-7 flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`border px-4 py-2 text-xs transition ${category === item ? 'border-white bg-white text-black' : 'border-white/20 text-white/65 hover:border-white'}`}>{item}</button>)}</div><div className="recommended-products grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">{filteredProducts.map((product, index) => <article key={product._id} className="min-w-0"><ProductImage product={product} index={index} onClick={() => openProductPreview(product)}/><div className="pt-3"><h3 className="truncate text-sm font-semibold">{product.name}</h3><ProductPrice product={product} className="mt-1 text-sm"/></div></article>)}</div></section>



    <section id="about" className="container-width grid gap-6 border-t border-white/10 py-12 sm:grid-cols-2 sm:py-16"><div><p className="mb-3 text-[10px] tracking-[0.25em] text-white/40">THE URBAN CAT POINT OF VIEW</p><h2 className="max-w-md text-3xl font-black leading-tight sm:text-4xl">Less Noise.<br/>More Identity.</h2></div><p className="max-w-lg text-sm leading-7 text-white/55">URBAN CAT is a streetwear storefront built around graphic tees and everyday essentials. Product details, availability and pricing will be maintained by the store owner.</p></section>

    <footer className="border-t border-white/10 bg-black px-5 py-10 sm:px-8">
      <div className="container-width grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-start gap-3">
          <img src="/URBAN-LOGO.png" alt="URBAN CAT logo" className="h-20 w-20 object-contain" />
          <p className="text-xs leading-6 text-white/55">Independent streetwear. Made to stand out.</p>
        </div>
        <div><h3 className="mb-4 text-xs font-bold tracking-[0.18em]">POLICIES</h3><div className="flex flex-col items-start gap-3 text-sm text-white/65">
          <button type="button" onClick={() => setPolicyView('privacy')} className="hover:text-[#d7ff45]">Privacy Policy</button>
          <button type="button" onClick={() => setPolicyView('shipping')} className="hover:text-[#d7ff45]">Shipping & Delivery</button>
          <button type="button" onClick={() => setPolicyView('terms')} className="hover:text-[#d7ff45]">Terms of Service</button>
          <button type="button" onClick={() => setPolicyView('cancellation')} className="hover:text-[#d7ff45]">Order Cancellation</button>
        </div></div>
        <div><h3 className="mb-4 text-xs font-bold tracking-[0.18em]">CONTACT US</h3><div className="flex flex-col items-start gap-3 text-sm text-white/65"><a className="hover:text-[#d7ff45]" href="mailto:samadhan.kale@gmail.com">Email: samadhan.kale@gmail.com</a><p>
  Phone: <a href="tel:9422090747">9422090747</a>
</p>

<p>
  Instagram:{" "}
  <a
    href="https://www.instagram.com/Urbancat_clothing/"
    target="_blank"
    rel="noopener noreferrer"
  >
    @Urbancat_clothing
  </a>
</p><button type="button" onClick={() => setPolicyView('contact')} className="hover:text-[#d7ff45]">Contact & Support</button><p className="text-xs text-white/35">For order questions, keep your order number handy.</p></div></div>
        <div><h3 className="mb-4 text-xs font-bold tracking-[0.18em]">ABOUT URBAN CAT</h3><div className="flex flex-col items-start gap-3 text-sm text-white/65"><button type="button" onClick={() => setPolicyView('about')} className="hover:text-[#d7ff45]">About Us</button><button type="button" onClick={() => setPolicyView('care')} className="hover:text-[#d7ff45]">Product Care</button></div></div>
      </div>
      <div className="container-width mt-8 border-t border-white/10 pt-5 text-center text-[10px] text-white/35">© {new Date().getFullYear()} URBAN CAT CLOTHING. All rights reserved.</div>
    </footer>

    {policyView && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setPolicyView(''); }}><section role="dialog" aria-modal="true" className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto border border-white/15 bg-[#101010] p-5 sm:p-8"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[10px] tracking-[0.24em] text-white/45">URBAN CAT / CUSTOMER INFORMATION</p><h2 className="mt-2 text-2xl font-black uppercase">{{privacy:'Privacy Policy',shipping:'Shipping & Delivery',terms:'Terms of Service',cancellation:'Order Cancellation',contact:'Contact & Support',about:'About URBAN CAT',care:'Product Care'}[policyView]}</h2></div><button type="button" onClick={() => setPolicyView('')} aria-label="Close policy" className="p-2 text-white/70 hover:text-white"><X size={20}/></button></div>
      {policyView === 'privacy' && <div className="space-y-4 text-sm leading-7 text-white/70"><p>We use the details you provide, such as your name, contact number, email and delivery address, to process orders, provide customer support and help prevent misuse of the store.</p><p>Order information is used to fulfil purchases and respond to order-related questions. We do not ask you to submit payment-card passwords or account passwords through customer support.</p><p>Access to order and customer information should be limited to authorised store personnel. For a request to correct or enquire about your information, contact our support email with relevant order details.</p></div>}
      {policyView === 'shipping' && <div className="space-y-4 text-sm leading-7 text-white/70"><p>Orders are prepared after the order details and product availability are confirmed. Dispatch and delivery time can vary by destination, courier availability and production workload.</p><p>Please enter a complete delivery address, valid phone number and PIN code at checkout. If a courier cannot reach you or the address is incomplete, delivery may be delayed.</p><p>Shipping charges, where applicable, will be shown before an order is placed. Tracking information will be shared when it is available. If your order appears delayed, contact support with your order number.</p></div>}
      {policyView === 'terms' && <div className="space-y-4 text-sm leading-7 text-white/70"><p>By using this store, you agree to provide accurate checkout information and use the website lawfully. Product images are intended to represent the item; minor variations in colour may occur across screens.</p><p>Prices, product descriptions, available sizes, colours and stock status may change. An order is subject to product availability and confirmation through the store's order process.</p><p>Please check size and colour selections before submitting an order. Do not misuse the website, attempt unauthorised access or submit false order information. Mandatory rights under applicable Indian law are not limited by these terms.</p></div>}
      {policyView === 'cancellation' && <div className="space-y-4 text-sm leading-7 text-white/70"><p>If you need to cancel an order, contact support as soon as possible and include your order number. Cancellation requests are handled according to the order's preparation and dispatch status.</p><p>An order that has already been prepared for dispatch or handed to the courier may not be cancellable through the website. Contact support to check the current status. This page does not promise cancellation after dispatch.</p></div>}
      {policyView === 'contact' && <div className="space-y-4 text-sm leading-7 text-white/70"><p>For help with products, orders, delivery or account access, contact the store support team.</p><p>Email: <a className="underline hover:text-[#d7ff45]" href="mailto:support@urbancat.in">support@urbancat.in</a></p><p className="mt-4">
  Phone: <a href="tel:9422090747">9422090747</a>
</p>

<p className="mt-4">
  Instagram:{" "}
  <a
    href="https://www.instagram.com/Urbancat_clothing/"
    target="_blank"
    rel="noopener noreferrer"
  >
    @Urbancat_clothing
  </a>
</p><p>Please include your order number where relevant. Do not email passwords or payment credentials.</p></div>}
      {policyView === 'about' && <div className="text-sm leading-7 text-white/70"><p>URBAN CAT is an independent streetwear label focused on graphic tees, everyday essentials and bold personal style. Our goal is to keep the store simple: clear product details, easy size and colour selection, and a straightforward shopping experience.</p></div>}
      {policyView === 'care' && <div className="space-y-4 text-sm leading-7 text-white/70"><p>To help your garment last, follow the care instructions on its label. As a general precaution, wash inside out with similar colours and avoid harsh bleach on printed or graphic areas.</p><p>Use a suitable wash cycle and avoid ironing directly over prints. Specific fabric and print care instructions on the garment label take priority.</p></div>}
      <div className="mt-7"><button type="button" onClick={() => setPolicyView('')} className="button-outline px-6 py-3">CLOSE</button></div></section></div>}



    {previewProduct && <div className="fixed inset-0 z-[58] flex items-stretch justify-stretch bg-black" onMouseDown={(e) => { if (e.target === e.currentTarget) closeProductPreview(); }}>
      <section
  role="dialog"
  aria-modal="true"
  aria-label={`${previewProduct.name} product gallery`}
  className="product-detail-panel relative grid h-[100dvh] w-full max-w-none grid-cols-1 overflow-y-auto border-0 border-white/15 bg-[#101010] md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]"
>
        <button type="button" onClick={closeProductPreview} aria-label="Close product gallery" className="absolute right-3 top-3 z-20 bg-black/70 p-2 text-white"><X size={20}/></button>
        {(() => {
          const gallery = [previewProduct.image, ...(Array.isArray(previewProduct.galleryImages) ? previewProduct.galleryImages : [])].filter(Boolean);
          const images = gallery.length ? gallery : [EDITORIAL_IMAGES[0]];
          const activeImage = images[Math.min(previewImageIndex, images.length - 1)] || images[0];
          return <div className="min-w-0 p-3 pt-14 sm:p-6 md:pt-6">
            <div className="relative flex h-[52vh] min-h-[320px] max-h-[78vh] items-center justify-center overflow-hidden bg-[#191919] md:h-[calc(100dvh-150px)]">
              <button type="button" onClick={() => setPreviewZoomed((zoomed) => !zoomed)} aria-label={previewZoomed ? "Zoom out product image" : "Zoom in product image"} title={previewZoomed ? "Zoom out" : "Click to zoom"} className="absolute inset-0 z-[1] flex h-full w-full items-center justify-center overflow-hidden cursor-zoom-in">
                <img src={activeImage} alt={`${previewProduct.name} view ${previewImageIndex + 1}`} className={`h-full w-full object-contain transition-transform duration-300 ${previewZoomed ? 'scale-[1.8] cursor-zoom-out' : 'scale-100'}`} />
              </button>
              <span className="pointer-events-none absolute bottom-3 left-1/2 z-[2] -translate-x-1/2 bg-black/70 px-3 py-1 text-[10px] tracking-wider text-white/80">{previewZoomed ? 'CLICK TO ZOOM OUT' : 'CLICK IMAGE TO ZOOM'}</span>
              {images.length > 1 && <>
                <button type="button" onClick={() => { setPreviewImageIndex((i) => (i - 1 + images.length) % images.length); setPreviewZoomed(false); }} aria-label="Previous image" className="absolute left-3 top-1/2 z-[3] -translate-y-1/2 border border-white/20 bg-black/70 p-3"><ChevronLeft size={18}/></button>
                <button type="button" onClick={() => { setPreviewImageIndex((i) => (i + 1) % images.length); setPreviewZoomed(false); }} aria-label="Next image" className="absolute right-3 top-1/2 z-[3] -translate-y-1/2 border border-white/20 bg-black/70 p-3"><ChevronRight size={18}/></button>
              </>}
            </div>
            {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">{images.map((url, i) => <button key={`${url}-${i}`} type="button" onClick={() => { setPreviewImageIndex(i); setPreviewZoomed(false); }} aria-label={`Show product image ${i + 1}`} className={`product-gallery-thumbnail aspect-[4/5] overflow-hidden border ${i === previewImageIndex ? 'border-white' : 'border-white/15 opacity-65 hover:opacity-100'}`}><img src={url} alt="" className="h-full w-full object-cover"/></button>)}<p className="mt-5 text-[10px] tracking-[0.18em] text-white/35 text-right">{Math.min(previewImageIndex + 1, (Array.isArray(previewProduct.galleryImages) ? previewProduct.galleryImages.length : 0) + (previewProduct.image ? 1 : 0))} / {(Array.isArray(previewProduct.galleryImages) ? previewProduct.galleryImages.length : 0) + (previewProduct.image ? 1 : 0) || 1} IMAGES</p></div>}
          </div>;
        })()}
        <div className="flex min-w-0 flex-col border-t border-white/10 p-5 pb-8 sm:p-8 md:overflow-y-auto md:border-l md:border-t-0 md:pt-16">
          <p className="text-[10px] tracking-[0.24em] text-white/45">URBAN CAT / PRODUCT DETAILS</p>
          <h2 className="mt-6 text-2xl font-black tracking-tight sm:text-4xl">{previewProduct.name}</h2>
          <ProductPrice product={previewProduct} className="mt-6 text-lg"/>
          <div className="my-10 h-px bg-white/15"/>
          <div className="mb-6">
            <p className="mb-8 text-xs font-bold uppercase tracking-[0.18em] text-white/70">Choose size</p>
            <div className="flex flex-wrap gap-2">{(Array.isArray(previewProduct.sizes) ? previewProduct.sizes : String(previewProduct.sizes || 'S, M, L, XL').split(',').map((s) => s.trim()).filter(Boolean)).map((size) => <button type="button" key={size} onClick={() => setSelectedSize(size)} className={`min-w-10 border px-3 py-2 text-sm transition ${selectedSize === size ? 'border-white bg-white text-black' : 'border-white/25 text-white hover:border-white'}`}>{size}</button>)}</div>
          </div>
          <div className="mb-6">
            <p className="mb-8 text-xs font-bold uppercase tracking-[0.18em] text-white/70">Choose colour</p>
            <div className="flex flex-wrap gap-2">{(Array.isArray(previewProduct.colours) ? previewProduct.colours : String(previewProduct.colours || 'Black, White').split(',').map((c) => c.trim()).filter(Boolean)).map((colour) => <button type="button" key={colour} onClick={() => setSelectedColour(colour)} className={`border px-3 py-2 text-sm transition ${selectedColour === colour ? 'border-white bg-white text-black' : 'border-white/25 text-white hover:border-white'}`}>{colour}</button>)}</div>
          </div>
          <div className="mb-6 mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <button type="button" onClick={addPreviewToCart} className="button w-full">ADD TO BAG</button>
            <button type="button" onClick={buyPreviewNow} className="button-outline w-full">BUY IT NOW</button>
          </div>
         <div className="mt-8">
  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
    Description
  </h3>

  <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-white/65">
    {(previewProduct.description || 'Everyday streetwear, made to stand out.')
  .split('.')
  .map((sentence, index, sentences) => {
    const text = sentence.trim();
    if (!text) return null;

    return (
      <span key={index}>
  {text}.
  {index < sentences.length - 1 && <br />}
</span>
    );
  })}
  </p>
</div>
          </div>
        <div className="mt-15 border-t border-white/15 pt-10 md:col-span-2">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
            <div className="mb-15 text-center">
              <p className="text-center text-[10px] tracking-[0.22em] text-white/40">YOU MAY ALSO LIKE</p>
              <h3 className="mt-4 text-center text-lg font-black uppercase tracking-tight">RECOMMENDED FOR YOU</h3>
            </div>
            </div>
            
  
<div className="relative">
  <div
    className="recommended-products flex gap-4 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory md:justify-center md:overflow-hidden md:snap-none"
  >
    {(window.matchMedia('(min-width: 768px)').matches
      ? visibleRecommendedProducts
      : recommendedProducts
    ).map((item, index) => (
      <button
        key={item._id || item.name}
        type="button"
        onClick={() => openProductPreview(item)}
        className="group w-[44%] min-w-[44%] shrink-0 snap-start text-left md:w-[15%] md:min-w-[15%] md:snap-none"
      >
        <div className="aspect-[4/5] w-full overflow-hidden bg-white/5">
          <img
            src={
              item.image ||
              EDITORIAL_IMAGES[
                (recommendedPage * recommendedPageSize + index) %
                  EDITORIAL_IMAGES.length
              ]
            }
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <p className="mt-3 truncate text-xs font-semibold">
          {item.name}
        </p>

        <ProductPrice product={item} className="mt-1 text-xs" />
      </button>
    ))}
  </div>

  {recommendedPageCount > 1 && (
    <>
      <button
        type="button"
        aria-label="Previous recommended products"
        onClick={() =>
          setRecommendedPage((page) => Math.max(0, page - 1))
        }
        disabled={recommendedPage === 0}
        className="absolute left-65 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white transition hover:bg-white hover:text-black disabled:opacity-30 md:flex"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        aria-label="Next recommended products"
        onClick={() =>
          setRecommendedPage((page) =>
            Math.min(recommendedPageCount - 1, page + 1)
          )
        }
        disabled={recommendedPage >= recommendedPageCount - 1}
        className="absolute right-65 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white transition hover:bg-white hover:text-black disabled:opacity-30 md:flex"
      >
        <ChevronRight size={20} />
      </button>
    </>
  )}

  {recommendedProducts.length === 0 && (
    <p className="py-8 text-center text-sm text-white/45">
      More styles coming soon.
    </p>
  )}

  {recommendedPageCount > 1 && (
    <p className="mt-5 text-center text-[10px] tracking-[0.16em] text-white/35">
      PAGE {recommendedPage + 1} / {recommendedPageCount}
    </p>
  )}
</div>

            <footer className="mt-15 border-t border-white/15 pt-15">
              <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-6 px-5 sm:grid-cols-4 sm:gap-8 sm:px-8 lg:px-12">
                <div className="col-span-2 flex items-center gap-3 sm:col-span-1 sm:items-start sm:flex-col"><img src="/URBAN-LOGO.png" alt="URBAN CAT logo" className="h-14 w-14 object-contain"/><p className="max-w-[220px] text-xs leading-5 text-white/50">Independent streetwear. Made to stand out.</p></div>
                <div><h4 className="mb-3 text-[10px] font-bold tracking-[0.18em] text-white/80">POLICIES</h4><div className="flex flex-col items-start gap-2 text-xs text-white/60"><button type="button" onClick={() => setPolicyView('privacy')} className="hover:text-[#d7ff45]">Privacy Policy</button><button type="button" onClick={() => setPolicyView('shipping')} className="hover:text-[#d7ff45]">Shipping &amp; Delivery</button><button type="button" onClick={() => setPolicyView('terms')} className="hover:text-[#d7ff45]">Terms of Service</button><button type="button" onClick={() => setPolicyView('cancellation')} className="hover:text-[#d7ff45]">Order Cancellation</button></div></div>
                <div><h3 className="mb-4 text-[10px] font-bold tracking-[0.18em]">CONTACT US</h3><div className="flex flex-col items-start gap-3 text-xs text-white/65"><a className="hover:text-[#d7ff45]" href="mailto:sadhank356@gmail.com">Email: sadhank356@gmail.com</a><p>
  Phone: <a href="tel:9422090747">9422090747</a>
</p>

<p>
  Instagram:{" "}
  <a
    href="https://www.instagram.com/Urbancat_clothing/"
    target="_blank"
    rel="noopener noreferrer"
  >
    @Urbancat_clothing
  </a>
</p><button type="button" onClick={() => setPolicyView('contact')} className="hover:text-[#d7ff45]">Contact & Support</button><p className="text-xs text-white/35">For order questions, keep your order number handy.</p></div></div>
                <div><h4 className="mb-3 text-[10px] font-bold tracking-[0.18em] text-white/80">ABOUT URBAN CAT</h4><div className="flex flex-col items-start gap-2 text-xs text-white/60"><button type="button" onClick={() => setPolicyView('about')} className="hover:text-[#d7ff45]">About Us</button><button type="button" onClick={() => setPolicyView('care')} className="hover:text-[#d7ff45]">Product Care</button></div></div>
              </div>
              <p className="mt-6 border-t border-white/10 pt-4 text-center text-[10px] text-white/35">© {new Date().getFullYear()} URBAN CAT CLOTHING. All rights reserved.</p>
            </footer>
          </div>
      </section>
    </div>}

    {variantProduct && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setVariantProduct(null); }}><section role="dialog" aria-modal="true" aria-labelledby="variant-title" className="w-full max-w-md border border-white/15 bg-[#101010] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] tracking-[0.22em] text-white/45">CHOOSE YOUR FIT</p><h2 id="variant-title" className="mt-2 text-xl font-bold">{variantProduct.name}</h2><p className="mt-1 text-sm text-white/60">₹{Number(variantProduct.price).toLocaleString('en-IN')}</p></div><button type="button" onClick={() => setVariantProduct(null)} aria-label="Close size and colour selector" className="p-1 text-white/70 hover:text-white"><X/></button></div><div className="mt-6"><p className="mb-3 text-sm font-semibold">Size <span className="font-normal text-white/50">— {selectedSize}</span></p><div className="flex flex-wrap gap-2">{(Array.isArray(variantProduct.sizes) ? variantProduct.sizes : String(variantProduct.sizes || 'S, M, L, XL').split(',').map((s) => s.trim()).filter(Boolean)).map((size) => <button type="button" key={size} onClick={() => setSelectedSize(size)} className={`min-w-12 border px-4 py-3 text-sm ${selectedSize === size ? 'border-white bg-white text-black' : 'border-white/25 text-white hover:border-white'}`}>{size}</button>)}</div></div><div className="mt-6"><p className="mb-3 text-sm font-semibold">Colour <span className="font-normal text-white/50">— {selectedColour}</span></p><div className="flex flex-wrap gap-2">{(Array.isArray(variantProduct.colours) ? variantProduct.colours : String(variantProduct.colours || 'Black, White').split(',').map((c) => c.trim()).filter(Boolean)).map((colour) => <button type="button" key={colour} onClick={() => setSelectedColour(colour)} className={`border px-4 py-3 text-sm ${selectedColour === colour ? 'border-white bg-white text-black' : 'border-white/25 text-white hover:border-white'}`}>{colour}</button>)}</div></div><button type="button" onClick={addToCart} className="button mt-7 w-full">ADD TO BAG · ₹{Number(variantProduct.price).toLocaleString('en-IN')}</button><p className="mt-3 text-center text-xs text-white/45">You can review your size and colour in the bag before ordering.</p></section></div>}



    {drawer && <div className={`drawer-backdrop fixed inset-0 z-50 flex justify-end ${drawer === 'admin' ? 'owner-backdrop' : 'bg-black/70'}`} onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawer(''); }}><aside className={`drawer-panel h-full w-full max-w-xl overflow-y-auto border-l border-white/15 bg-[#090909] p-5 sm:p-7 ${drawer === 'admin' ? 'owner-panel' : ''}`}><div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-[10px] tracking-[0.2em] text-white/45">URBAN CAT</p><h2 className="mt-1 text-xl font-bold">{drawer === 'cart' ? 'Your bag' : drawer === 'checkout' ? 'Checkout' : 'Store owner'}</h2></div><button onClick={() => { setDrawer(''); if (window.location.pathname === '/owner/login') window.history.pushState({}, '', '/'); }} aria-label="Close panel" className="p-2"><X/></button></div>

      {drawer === 'cart' && <><p className="mb-5 text-sm text-white/50">{cartCount} item(s) in your bag</p>{cart.length === 0 ? <p className="text-sm text-white/50">Your bag is empty.</p> : <><div className="space-y-4">{cart.map((item) => <div key={item.key} className="flex gap-4 border-b border-white/10 pb-4"><div className="product-placeholder h-24 w-20 shrink-0 overflow-hidden">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = EDITORIAL_IMAGES[0]; }}/> : <img src={EDITORIAL_IMAGES[0]} alt={item.name} className="h-full w-full object-cover"/>}</div><div className="flex-1"><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-white/50">Size {item.size} · {item.colour}</p><ProductPrice product={item} className="mt-1 text-sm"/><div className="mt-3 flex items-center gap-3"><button onClick={() => changeQty(item.key, -1)} aria-label="Decrease quantity"><Minus size={15}/></button><span className="text-sm">{item.quantity}</span><button onClick={() => changeQty(item.key, 1)} aria-label="Increase quantity" disabled={item.quantity >= 20}><Plus size={15}/></button><button className="ml-auto text-white/50" onClick={() => setCart((c) => c.filter((x) => x.key !== item.key))} aria-label="Remove item"><Trash2 size={16}/></button></div></div></div>)}</div><div className="mt-6 flex justify-between text-lg font-bold"><span>Subtotal</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div><p className="mt-2 text-xs text-white/45">Shipping charges and final availability will be confirmed by the store owner.</p><button className="button mt-6 w-full" onClick={() => setDrawer('checkout')}>CONTINUE TO ORDER <ArrowRight className="ml-2 inline" size={15}/></button></>}</>}

      {drawer === 'checkout' && <form onSubmit={payWithRazorpay} className="space-y-6">
        <div className="rounded-sm border border-white/10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-[#101010] to-[#080808] p-5">
          <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold tracking-[0.24em] text-white/45">SECURE CHECKOUT / 01</span><span className="flex items-center gap-1.5 text-[10px] tracking-widest text-[#d9ff7a]"><LockKeyhole size={13}/> ENCRYPTED</span></div>
          <p className="mt-4 text-3xl font-black tracking-[-0.06em]">CHECK OUT.</p><p className="mt-2 max-w-xs text-xs leading-5 text-white/50">Your next favourite piece is almost yours. Confirm delivery details to continue to secure payment.</p>
          <div className="mt-5 grid grid-cols-3 gap-2">{[['01','DETAILS'],['02','PAYMENT'],['03','CONFIRM']].map(([n,label],i)=><div key={n} className={`border-t-2 pt-2 ${i===0?'border-[#d9ff7a]':'border-white/15'}`}><p className="text-[9px] text-white/35">{n}</p><p className="mt-1 text-[9px] font-bold tracking-[0.12em]">{label}</p></div>)}</div>
        </div>
        <section><div className="mb-4 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center border border-white/20 text-xs">01</span><div><h3 className="text-sm font-bold">Delivery details</h3><p className="text-[11px] text-white/40">Where should we send your order?</p></div></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{['name','phone','email','pincode','city','state'].map((key) => <Field key={key} label={`${key === 'pincode' ? 'PIN code' : key[0].toUpperCase() + key.slice(1)}${key === 'email' ? ' (optional)' : ''}`} type={key === 'email' ? 'email' : 'text'} required={key !== 'email'} value={customer[key]} onChange={(e) => setCustomer((c) => ({ ...c, [key]: e.target.value }))} autoComplete={key === 'name' ? 'name' : key === 'phone' ? 'tel' : key === 'email' ? 'email' : key === 'pincode' ? 'postal-code' : 'off'}/>)}</div><div className="mt-3"><Field label="Full delivery address" value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} autoComplete="street-address" required placeholder="House / flat, street, landmark"/></div></section>
        <section className="border border-white/15 p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#d9ff7a]/40 bg-[#d9ff7a]/10 text-[#d9ff7a]"><CreditCard size={19}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">Pay online</h3><span className="border border-[#d9ff7a]/35 px-2 py-1 text-[9px] font-bold tracking-widest text-[#d9ff7a]">RECOMMENDED</span></div><p className="mt-1 text-xs leading-5 text-white/50">UPI, debit/credit cards payment methods available through Razorpay, depending on eligibility.</p><div className="mt-3 flex flex-wrap gap-2">{['UPI','CARDS'].map((method)=><span key={method} className="border border-white/10 px-2 py-1 text-[9px] tracking-wider text-white/55">{method}</span>)}</div></div></div></section>
        <section className="border border-white/10 bg-white/[0.025] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">Order Summary</h3><span className="text-[10px] tracking-widest text-white/40">{cartCount} ITEM{cartCount===1?'':'S'}</span></div><div className="max-h-40 space-y-3 overflow-y-auto">{cart.map((item)=><div key={item.key} className="flex items-start justify-between gap-3 text-xs"><div className="min-w-0"><p className="font-semibold">{item.name}</p><p className="mt-1 text-white/40">{item.size} / {item.colour} · Qty {item.quantity}</p></div><span className="shrink-0">₹{(Number(item.discountedPrice ?? item.price)*item.quantity).toLocaleString('en-IN')}</span></div>)}</div><div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm"><div className="flex justify-between text-white/55"><span>Subtotal (incl. of all taxes)</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div><div className="flex justify-between text-white/55">
  <span>Product Handling Fees</span>
  <span>₹15</span>
</div>
<div className="flex justify-between text-white/55">
  <span>Discount on MRP</span>
  <span className="text-[#d9ff7a]">
    -₹{cartSavings.toLocaleString('en-IN')}
  </span>
</div>
<div className="flex justify-between text-white/55">
  <span>Shipping</span>
  <span>Free Delivery</span>
</div>
  <div className="flex items-end justify-between gap-3 pt-2"><span className="text-xs font-bold tracking-widest">TOTAL PAYABLE</span><span className="text-2xl font-black tracking-tight">₹{(cartTotal + 15).toLocaleString('en-IN')}</span></div><div className="mt-4 border-t border-white/10 pt-4 text-center text-sm font-bold text-[#d9ff7a]">
  You'll Save ₹{cartSavings.toLocaleString('en-IN')} on this order
</div></div></section>
        <button type="submit" disabled={checkoutBusy || !cart.length || usingDemo} className="button flex w-full items-center justify-center gap-2 py-4 text-xs">{checkoutBusy ? 'PREPARING SECURE PAYMENT…' : <>PAY ₹{(cartTotal + 15).toLocaleString('en-IN')} SECURELY <ArrowRight size={15}/></>}</button>
        <div className="flex items-start gap-2 text-[10px] leading-5 text-white/40"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#d9ff7a]"/><p>Payments are processed by Razorpay. Your order is marked paid only after server-side verification. Never share your OTP or card PIN with anyone.</p></div>
        {usingDemo && <p className="text-xs text-amber-200/80">Connect the database and load real products before accepting payments.</p>}
      </form>}

      {drawer === 'admin' && <>{!adminToken ? <form onSubmit={doLogin} className="space-y-4"><p className="text-sm leading-6 text-white/50">Owner login is configured on the backend using environment variables. Never put the owner password in frontend code.</p><Field label="Username" value={login.username} onChange={(e) => setLogin((v) => ({ ...v, username: e.target.value }))} autoComplete="username" required/><Field label="Password" type="password" value={login.password} onChange={(e) => setLogin((v) => ({ ...v, password: e.target.value }))} autoComplete="current-password" required/><button disabled={busy} className="button w-full">{busy ? 'SIGNING IN…' : 'SIGN IN'}</button>{adminMessage && <p className="text-sm text-white/65">{adminMessage}</p>}</form> : <><div className="mb-5 flex items-center justify-between"><p className="text-sm text-white/55">Signed in as <strong className="text-white">{adminUser}</strong></p><button className="button-outline flex items-center gap-2" onClick={logout}><LogOut size={14}/> LOG OUT</button></div><div className="mb-5 flex gap-2"><button className={adminTab === 'products' ? 'button' : 'button-outline'} onClick={() => setAdminTab('products')}>PRODUCTS</button><button className={adminTab === 'orders' ? 'button' : 'button-outline'} onClick={() => setAdminTab('orders')}>ORDERS</button><button className={adminTab === 'payments' ? 'button' : 'button-outline'} onClick={() => setAdminTab('payments')}>PAYMENTS</button><button className="button-outline ml-auto flex items-center gap-2" onClick={loadAdminData}><RefreshCw size={13}/> REFRESH</button></div>{adminMessage && <p className="mb-4 text-sm text-white/65">{adminMessage}</p>}{adminTab === 'products' ? <><form onSubmit={saveProduct} className="mb-7 space-y-3 border border-white/15 p-4"><h3 className="font-bold">{editingId ? 'Edit product' : 'Add product'}</h3><Field label="Product name" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} required/><Field label="Category" value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} required/><Field label="Price (INR)" type="number" min="0" step="1" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} required/><Field label="Discount (%) — enter 0 for no discount" type="number" min="0" max="100" step="1" value={productForm.discountPercent ?? '0'} onChange={(e) => setProductForm((p) => ({ ...p, discountPercent: e.target.value }))} required/><p className="text-xs text-white/45">Discounted price preview: ₹{(Math.round(Math.max(0, Number(productForm.price || 0)) * (1 - Math.min(100, Math.max(0, Number(productForm.discountPercent || 0))) / 100) * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p><div className="image-upload-field"><span className="field-label">Product photo</span><div className="flex flex-wrap items-start gap-4">{productForm.image && !imagePreviewError ? <img src={productForm.image} alt="Product preview" className="h-28 w-24 rounded-sm border border-white/15 object-cover" onError={() => setImagePreviewError(true)}/> : <div className="flex h-28 w-24 flex-col items-center justify-center gap-2 border border-dashed border-white/20 text-white/40"><ImageIcon size={24}/><span className="text-[10px]">NO PREVIEW</span></div>}<div className="min-w-[220px] flex-1"><label className="button-outline inline-flex items-center gap-2" style={{cursor:imageUploading?'wait':'pointer',opacity:imageUploading ? 0.6 : 1}}><UploadCloud size={15}/>{imageUploading ? 'UPLOADING…' : 'UPLOAD IMAGE'}<input type="file" accept="image/*" className="sr-only" onChange={uploadProductImage} disabled={imageUploading}/></label><label className="button-outline ml-1 inline-flex items-center gap-2" style={{cursor:imageUploading?'wait':'pointer',opacity:imageUploading || (productForm.galleryImages || []).length >= 4 ? 0.6 : 1}}><ImageIcon size={15}/>UPLOAD GALLERY ({(productForm.galleryImages || []).length}/4)<input type="file" accept="image/*" multiple className="sr-only" onChange={uploadGalleryImages} disabled={imageUploading || (productForm.galleryImages || []).length >= 4}/></label><p className="mt-2 text-xs leading-5 text-white/45">Main image is the product card image. Add up to 4 extra gallery images, max 8 MB each.</p><input aria-label="Product image URL" className="input mt-3" type="url" placeholder="Or paste an image URL" value={productForm.image} onChange={(e) => { setProductForm((p) => ({ ...p, image: e.target.value })); setImagePreviewError(false); }}/>{(productForm.galleryImages || []).length > 0 && <div className="mt-3 grid grid-cols-4 gap-2">{productForm.galleryImages.map((url, i) => <div key={`${url}-${i}`} className="relative"><img src={url} alt={`Gallery image ${i + 1}`} className="h-20 w-full border border-white/15 object-cover"/><button type="button" onClick={() => setProductForm((p) => ({ ...p, galleryImages: p.galleryImages.filter((_, j) => j !== i) }))} className="absolute right-1 top-1 bg-black/80 px-2 py-1 text-xs" aria-label={`Remove gallery image ${i + 1}`}>×</button></div>)}</div>}</div></div></div><Field label="Description" value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}/><Field label="Sizes, comma-separated" value={productForm.sizes} onChange={(e) => setProductForm((p) => ({ ...p, sizes: e.target.value }))}/><Field label="Colours, comma-separated" value={productForm.colours} onChange={(e) => setProductForm((p) => ({ ...p, colours: e.target.value }))}/><Field label="Badge (optional)" value={productForm.badge} onChange={(e) => setProductForm((p) => ({ ...p, badge: e.target.value }))}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={productForm.published} onChange={(e) => setProductForm((p) => ({ ...p, published: e.target.checked }))}/> Published on store</label><div className="flex gap-2"><button className="button" disabled={busy}>{editingId ? 'SAVE CHANGES' : 'ADD PRODUCT'}</button>{editingId && <button type="button" className="button-outline" onClick={resetProductForm}>CANCEL</button>}</div></form><div className="space-y-3">{adminProducts.map((product) => <div key={product._id} className="flex items-start gap-3 border-b border-white/10 pb-3"><div className="flex-1"><p className="font-semibold">{product.name}</p><div className="mt-1 text-xs text-white/50"><ProductPrice product={product} className="inline-flex"/> · {product.category} · {product.published ? 'Published' : 'Hidden'}</div></div><button className="button-outline" onClick={() => startEdit(product)}>EDIT</button><button className="button-outline" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`}><Trash2 size={14}/></button></div>)}</div></> : adminTab === 'payments' ? <div className="space-y-5">
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div className="border border-white/15 bg-white/[0.025] p-4"><p className="text-[10px] tracking-[0.18em] text-white/45">CAPTURED PAYMENTS</p><p className="mt-3 text-2xl font-black">{orders.filter((order) => order.paymentStatus === 'paid').length}</p><p className="mt-1 text-xs text-white/40">Verified successful transactions</p></div>
    <div className="border border-[#d9ff7a]/25 bg-[#d9ff7a]/[0.04] p-4"><p className="text-[10px] tracking-[0.18em] text-white/45">CAPTURED VALUE</p><p className="mt-3 text-2xl font-black text-[#d9ff7a]">₹{orders.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + Number(order.total || 0), 0).toLocaleString('en-IN')}</p><p className="mt-1 text-xs text-white/40">Based on verified paid orders</p></div>
    <div className="border border-white/15 bg-white/[0.025] p-4"><p className="text-[10px] tracking-[0.18em] text-white/45">AWAITING PAYMENT</p><p className="mt-3 text-2xl font-black">{orders.filter((order) => order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid').length}</p><p className="mt-1 text-xs text-white/40">Not counted as captured revenue</p></div>
  </div>
  <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold">Transaction ledger</h3><p className="mt-1 text-xs text-white/40">Only server-verified captured payments count as paid.</p></div><span className="text-[10px] tracking-widest text-white/40">{orders.length} ORDERS</span></div>
  {orders.length === 0 ? <p className="border border-white/10 p-6 text-sm text-white/50">No transactions yet. New online payments will appear here.</p> : orders.slice().sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map((order) => <article key={order._id} className="border border-white/15 bg-[#111] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold tracking-wide">{order.orderNumber}</p><p className="mt-1 text-xs text-white/45">{order.customer?.name || 'Customer'} · {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'Date unavailable'}</p></div><span className={`border px-2 py-1 text-[9px] font-bold tracking-widest ${order.paymentStatus === 'paid' ? 'border-[#d9ff7a]/40 text-[#d9ff7a]' : 'border-white/15 text-white/55'}`}>{String(order.paymentStatus || 'unpaid').toUpperCase()}</span></div><div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-3"><div><p className="text-xl font-black">₹{Number(order.total || 0).toLocaleString('en-IN')}</p><p className="mt-1 break-all text-[10px] text-white/40">{order.razorpayPaymentId ? `Payment ID: ${order.razorpayPaymentId}` : `Method: ${String(order.paymentMethod || 'manual').toUpperCase()}`}</p></div><button type="button" className="button-outline" onClick={() => setAdminTab('orders')}>VIEW ORDERS <ArrowRight size={13} className="ml-1 inline"/></button></div></article>)}
</div> : <div className="space-y-4">{orders.length === 0 && <p className="text-sm text-white/50">No orders yet.</p>}{orders.map((order) => <article key={order._id} className="border border-white/15 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{order.orderNumber}</p><p className="mt-1 text-xs text-white/50">{order.customer?.name} · {order.customer?.phone}</p><p className="mt-2 text-sm">₹{Number(order.total).toLocaleString('en-IN')}</p><p className={`mt-2 inline-flex border px-2 py-1 text-[10px] tracking-widest ${order.paymentStatus === 'paid' ? 'border-[#d9ff7a]/40 text-[#d9ff7a]' : 'border-white/15 text-white/50'}`}>PAYMENT: {String(order.paymentStatus || 'unpaid').toUpperCase()} · {String(order.paymentMethod || 'manual').toUpperCase()}</p></div><select className="input max-w-[190px]" value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)} title={order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid' ? 'Only cancellation is allowed until payment is verified.' : 'Update fulfilment status'}>{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div><p className="mt-3 text-xs leading-5 text-white/55">{order.customer?.address}, {order.customer?.city}, {order.customer?.state} — {order.customer?.pincode}</p><div className="mt-3 space-y-1">{order.items?.map((item, i) => <p key={i} className="text-xs text-white/65">{item.quantity} × {item.name} ({item.size}, {item.colour})</p>)}</div></article>)}</div>}</>}</>}

    </aside></div>}



{customerAuthOpen && (

  <div

    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"

    onMouseDown={(e) => {

      if (e.target === e.currentTarget) setCustomerAuthOpen(false);

    }}

  >

    <section

      role="dialog"

      aria-modal="true"

      aria-labelledby="customer-auth-title"

      className="w-full max-w-md border border-white/15 bg-[#101010] p-6 sm:p-8"

    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-xs tracking-[0.25em] text-white/45">

            URBAN CAT ACCOUNT

          </p>

          <h2 id="customer-auth-title" className="mt-3 text-2xl font-black">

            {customerAuthMode === 'login' ? 'WELCOME BACK.' : 'JOIN THE DROP.'}

          </h2>

        </div>



        <button

          type="button"

          onClick={() => setCustomerAuthOpen(false)}

          className="text-white/60 hover:text-white"

          aria-label="Close login form"

        >

          <X />

        </button>

      </div>



      <div className="mt-6 grid grid-cols-2 border border-white/15 p-1">

        <button

          type="button"

          onClick={() => {

            setCustomerAuthMode('login');

            setCustomerAuthMessage('');

          }}

          className={`px-3 py-3 text-sm ${

            customerAuthMode === 'login'

              ? 'bg-white text-black'

              : 'text-white/65'

          }`}

        >

          LOGIN

        </button>



        <button

          type="button"

          onClick={() => {

            setCustomerAuthMode('signup');

            setCustomerAuthMessage('');

          }}

          className={`px-3 py-3 text-sm ${

            customerAuthMode === 'signup'

              ? 'bg-white text-black'

              : 'text-white/65'

          }`}

        >

          CREATE ACCOUNT

        </button>

      </div>



      <form onSubmit={submitCustomerAuth} className="mt-6 space-y-4">

        {customerAuthMode === 'signup' && (

          <Field

            label="Full name"

            type="text"

            autoComplete="name"

            minLength={2}

            maxLength={120}

            value={customerAuthForm.name}

            onChange={(e) =>

              setCustomerAuthForm((form) => ({

                ...form,

                name: e.target.value,

              }))

            }

            required

          />

        )}



        <Field

          label="Email address"

          type="email"

          autoComplete="email"

          maxLength={200}

          value={customerAuthForm.email}

          onChange={(e) =>

            setCustomerAuthForm((form) => ({

              ...form,

              email: e.target.value,

            }))

          }

          placeholder="you@example.com"

          required

        />



        <Field

          label="Password"

          type="password"

          autoComplete={

            customerAuthMode === 'login'

              ? 'current-password'

              : 'new-password'

          }

          minLength={8}

          maxLength={128}

          value={customerAuthForm.password}

          onChange={(e) =>

            setCustomerAuthForm((form) => ({

              ...form,

              password: e.target.value,

            }))

          }

          placeholder="At least 8 characters"

          required

        />



        {customerAuthMessage && (

          <p role="alert" className="text-sm text-red-300">

            {customerAuthMessage}

          </p>

        )}



        <button

          type="submit"

          className="button w-full"

          disabled={customerAuthBusy}

        >

          {customerAuthBusy

            ? 'PLEASE WAIT...'

            : customerAuthMode === 'login'

              ? 'SIGN IN'

              : 'CREATE ACCOUNT'}

        </button>

      </form>



      <p className="mt-5 text-center text-xs leading-5 text-white/45">

        Your account is protected by password hashing and server-side

        authentication.

      </p>

    </section>

  </div>

)}



    {orderResult && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-md border border-white/20 bg-[#101010] p-6"><p className="flex items-center gap-2 text-xs tracking-[0.25em] text-[#d9ff7a]"><CheckCircle2 size={15}/> PAYMENT VERIFIED</p><h2 className="mt-3 text-2xl font-black">You’re in.</h2><p className="mt-3 text-sm leading-6 text-white/65">Your payment has been verified securely. Keep your order number for tracking; the store will update fulfilment status as your order moves.</p><div className="mt-5 border border-white/15 p-4"><p className="text-xs text-white/50">ORDER NUMBER</p><p className="mt-1 text-xl font-bold">{orderResult.orderNumber}</p><p className="mt-3 text-sm">Subtotal: ₹{Number(orderResult.total).toLocaleString('en-IN')}</p><p className="mt-2 text-sm">Product Handling Fees: ₹15</p><p className="mt-2 text-xs text-white/50">Order status: {orderResult.status}</p><p className="mt-1 text-xs text-[#d9ff7a]">Payment: {(orderResult.paymentStatus || 'paid').toUpperCase()}</p></div><button className="button mt-5 w-full" onClick={() => setOrderResult(null)}>CONTINUE SHOPPING</button></div></div>}

    {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 border border-white/20 bg-[#171717] px-5 py-3 text-center text-sm shadow-xl">{toast}</div>}

  </div>;

}
