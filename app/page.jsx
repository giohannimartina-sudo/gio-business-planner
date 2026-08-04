'use client';

import { useCallback } from 'react';

export default function Home() {
  const enhancePlanner = useCallback((event) => {
    const frame = event.currentTarget;
    const doc = frame.contentDocument;
    if (!doc || doc.getElementById('gio-approved-css')) return;

    const css = doc.createElement('link');
    css.id = 'gio-approved-css';
    css.rel = 'stylesheet';
    css.href = '/gio-mobile-approved.css?v=003';
    doc.head.appendChild(css);

    const script = doc.createElement('script');
    script.id = 'gio-approved-js';
    script.src = '/gio-mobile-approved.js?v=003';
    script.defer = true;
    doc.body.appendChild(script);

    const trips = doc.createElement('script');
    trips.id = 'gio-trips-js';
    trips.src = '/gio-trips-pro.js?v=003';
    trips.defer = true;
    doc.body.appendChild(trips);
  }, []);

  return (
    <iframe
      src="/planner.html"
      title="GIO Business Planner PRO"
      onLoad={enhancePlanner}
      style={{ width: '100%', height: '100vh', border: 0, display: 'block' }}
    />
  );
}
