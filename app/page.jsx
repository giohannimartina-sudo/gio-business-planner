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
    css.href = '/gio-mobile-approved.css?v=026';
    doc.head.appendChild(css);

    const script = doc.createElement('script');
    script.id = 'gio-approved-js';
    script.src = '/gio-mobile-approved.js?v=026';
    script.defer = true;
    doc.body.appendChild(script);

    const trips = doc.createElement('script');
    trips.id = 'gio-trips-js';
    trips.src = '/gio-trips-pro.js?v=026';
    trips.defer = true;
    doc.body.appendChild(trips);

    const personnel = doc.createElement('script');
    personnel.id = 'gio-personnel-js';
    personnel.src = '/gio-personnel-pro.js?v=026';
    personnel.defer = true;
    doc.body.appendChild(personnel);
    const menu = doc.createElement('script');
    menu.id='gio-smart-menu-js';
    menu.src='/gio-smart-menu.js?v=026';
    menu.defer=true;
    doc.body.appendChild(menu);
    const master=document.createElement('script');
    master.id='gio-master-dashboard-js';
    master.src='/gio-master-dashboard.js?v=026';
    master.defer=true;
    doc.body.appendChild(master);
    const dossier=document.createElement('script');
    dossier.id='gio-project-dossier-js';
    dossier.src='/gio-project-dossier.js?v=026';
    dossier.defer=true;
    doc.body.appendChild(dossier);
    const scanner=document.createElement('script');
    scanner.id='gio-receipt-scanner-js';
    scanner.src='/gio-receipt-scanner.js?v=026';
    scanner.defer=true;
    doc.body.appendChild(scanner);

    const workbook = doc.createElement('script');
    workbook.id = 'gio-workbook-pro-js';
    workbook.src = '/gio-workbook-pro.js?v=026';
    workbook.defer = true;
    doc.body.appendChild(workbook);

    const clients = doc.createElement('script');
    clients.id = 'gio-clients-pro-js';
    clients.src = '/gio-clients-pro.js?v=026';
    clients.defer = true;
    doc.body.appendChild(clients);

    const vehicles = doc.createElement('script');
    vehicles.id = 'gio-vehicles-pro-js';
    vehicles.src = '/gio-vehicles-pro.js?v=026';
    vehicles.defer = true;
    doc.body.appendChild(vehicles);

    const tools = doc.createElement('script');
    tools.id = 'gio-tools-pro-js';
    tools.src = '/gio-tools-pro.js?v=026';
    tools.defer = true;
    doc.body.appendChild(tools);

    const offers = doc.createElement('script');
    offers.id = 'gio-offers-pro-js';
    offers.src = '/gio-offers-pro.js?v=026';
    offers.defer = true;
    doc.body.appendChild(offers);

    const invoices = doc.createElement('script');
    invoices.id = 'gio-invoices-pro-js';
    invoices.src = '/gio-invoices-pro.js?v=026';
    invoices.defer = true;
    doc.body.appendChild(invoices);

    const dashboardPro = doc.createElement('script');
    dashboardPro.id = 'gio-dashboard-pro-js';
    dashboardPro.src = '/gio-dashboard-pro.js?v=026';
    dashboardPro.defer = true;
    doc.body.appendChild(dashboardPro);

    const guard = doc.createElement('script');
    guard.id = 'gio-data-guard-js';
    guard.src = '/gio-data-guard.js?v=026';
    guard.defer = true;
    doc.body.appendChild(guard);
    const stock = doc.createElement('script');
    stock.id='gio-stock-pro-js';
    stock.src='/gio-stock-pro.js?v=026';
    stock.defer=true;
    doc.body.appendChild(stock);
    const expenses=document.createElement('script');
    expenses.id='gio-expenses-pro-js';
    expenses.src='/gio-expenses-pro.js?v=026';
    expenses.defer=true;
    doc.body.appendChild(expenses);
    const planningPro=document.createElement('script');
    planningPro.id='gio-planning-pro-js';
    planningPro.src='/gio-planning-pro.js?v=026';
    planningPro.defer=true;
    doc.body.appendChild(planningPro);
    const hoursPro=document.createElement('script');
    hoursPro.id='gio-hours-pro-js';
    hoursPro.src='/gio-hours-pro.js?v=026';
    hoursPro.defer=true;
    doc.body.appendChild(hoursPro);
    const materialsPro=document.createElement('script');
    materialsPro.id='gio-materials-pro-js';
    materialsPro.src='/gio-materials-pro.js?v=026';
    materialsPro.defer=true;
    doc.body.appendChild(materialsPro);
    const projectArchive=document.createElement('script');
    projectArchive.id='gio-project-archive-js';
    projectArchive.src='/gio-project-archive.js?v=026';
    projectArchive.defer=true;
    doc.body.appendChild(projectArchive);
    const analyticsPro=document.createElement('script');
    analyticsPro.id='gio-analytics-pro-js';
    analyticsPro.src='/gio-analytics-pro.js?v=026';
    analyticsPro.defer=true;
    doc.body.appendChild(analyticsPro);

    const remindersPro = doc.createElement('script');
    remindersPro.id = 'gio-reminders-pro-js';
    remindersPro.src = '/gio-reminders-pro.js?v=026';
    remindersPro.defer = true;
    doc.body.appendChild(remindersPro);
    const worklinkMaster=document.createElement('script');
    worklinkMaster.src='/gio-worklink-master-pro.js?v=026';
    worklinkMaster.defer=true;
    doc.body.appendChild(worklinkMaster);
    const cloudPro=document.createElement('script');
    cloudPro.id='gio-cloud-sync-pro-js';
    cloudPro.src='/gio-cloud-sync-pro.js?v=026';
    cloudPro.defer=true;
    doc.body.appendChild(cloudPro);

















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
