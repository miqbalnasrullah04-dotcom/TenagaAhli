/**
 * Midtrans Snap Loader Utility
 * Dynamically loads Snap.js using client key and environment settings.
 */
export function loadMidtransSnap() {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }
    const isProd =
      import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true' ||
      import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === '1';
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'Mid-client-kw4OzjqRXjs0P9zQ';
    const script = document.createElement('script');
    script.src = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve(window.snap);
    document.body.appendChild(script);
  });
}
