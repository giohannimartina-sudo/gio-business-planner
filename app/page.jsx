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
    css.href = '/gio-mobile-approved.css?v=014';
    doc.head.appendChild(css);

    const script = doc.createElement('script');
    script.id = 'gio-approved-js';
    script.src = '/gio-mobile-approved.js?v=014';
    script.defer = true;
    doc.body.appendChild(script);

    const trips = doc.createElement('script');
    trips.id = 'gio-trips-js';
    trips.src = '/gio-trips-pro.js?v=014';
    trips.defer = true;
    doc.body.appendChild(trips);

    const personnel = doc.createElement('script');
    personnel.id = 'gio-personnel-js';
    personnel.src = '/gio-personnel-pro.js?v=014';
    personnel.defer = true;
    doc.body.appendChild(personnel);
    const menu = doc.createElement('script');
    menu.id='gio-smart-menu-js';
    menu.src='/gio-smart-menu.js?v=014';
    menu.defer=true;
    doc.body.appendChild(menu);
    const master=document.createElement('script');
    master.id='gio-master-dashboard-js';
    master.src='/gio-master-dashboard.js?v=014';
    master.defer=true;
    doc.body.appendChild(master);
    const dossier=document.createElement('script');
    dossier.id='gio-project-dossier-js';
    dossier.src='/gio-project-dossier.js?v=014';
    dossier.defer=true;
    doc.body.appendChild(dossier);
    const scanner=document.createElement('script');
    scanner.id='gio-receipt-scanner-js';
    scanner.src='/gio-receipt-scanner.js?v=014';
    scanner.defer=true;
    doc.body.appendChild(scanner);

    const workbook = doc.createElement('script');
    workbook.id = 'gio-workbook-pro-js';
    workbook.src = '/gio-workbook-pro.js?v=014';
    workbook.defer = true;
    doc.body.appendChild(workbook);

    const clients = doc.createElement('script');
    clients.id = 'gio-clients-pro-js';
    clients.src = '/gio-clients-pro.js?v=014';
    clients.defer = true;
    doc.body.appendChild(clients);

    const vehicles = doc.createElement('script');
    vehicles.id = 'gio-vehicles-pro-js';
    vehicles.src = '/gio-vehicles-pro.js?v=014';
    vehicles.defer = true;
    doc.body.appendChild(vehicles);

    const tools = doc.createElement('script');
    tools.id = 'gio-tools-pro-js';
    tools.src = '/gio-tools-pro.js?v=014';
    tools.defer = true;
    doc.body.appendChild(tools);

    const offers = doc.createElement('script');
    offers.id = 'gio-offers-pro-js';
    offers.src = '/gio-offers-pro.js?v=014';
    offers.defer = true;
    doc.body.appendChild(offers);

    const invoices = doc.createElement('script');
    invoices.id = 'gio-invoices-pro-js';
    invoices.src = '/gio-invoices-pro.js?v=014';
    invoices.defer = true;
    doc.body.appendChild(invoices);





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
