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
    css.href = '/gio-mobile-approved.css?v=009';
    doc.head.appendChild(css);

    const script = doc.createElement('script');
    script.id = 'gio-approved-js';
    script.src = '/gio-mobile-approved.js?v=009';
    script.defer = true;
    doc.body.appendChild(script);

    const trips = doc.createElement('script');
    trips.id = 'gio-trips-js';
    trips.src = '/gio-trips-pro.js?v=009';
    trips.defer = true;
    doc.body.appendChild(trips);

    const personnel = doc.createElement('script');
    personnel.id = 'gio-personnel-js';
    personnel.src = '/gio-personnel-pro.js?v=009';
    personnel.defer = true;
    doc.body.appendChild(personnel);
    const menu = doc.createElement('script');
    menu.id='gio-smart-menu-js';
    menu.src='/gio-smart-menu.js?v=009';
    menu.defer=true;
    doc.body.appendChild(menu);
    const master=document.createElement('script');
    master.id='gio-master-dashboard-js';
    master.src='/gio-master-dashboard.js?v=009';
    master.defer=true;
    doc.body.appendChild(master);
    const dossier=document.createElement('script');
    dossier.id='gio-project-dossier-js';
    dossier.src='/gio-project-dossier.js?v=009';
    dossier.defer=true;
    doc.body.appendChild(dossier);
    const scanner=document.createElement('script');
    scanner.id='gio-receipt-scanner-js';
    scanner.src='/gio-receipt-scanner.js?v=009';
    scanner.defer=true;
    doc.body.appendChild(scanner);

    const workbook = doc.createElement('script');
    workbook.id = 'gio-workbook-pro-js';
    workbook.src = '/gio-workbook-pro.js?v=009';
    workbook.defer = true;
    doc.body.appendChild(workbook);
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
