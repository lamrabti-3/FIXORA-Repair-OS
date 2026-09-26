# FIXORA — AI / Developer Handoff

## Product idea

FIXORA is a mobile-first operating system for a phone repair technician or a small repair shop. It is not a generic productivity dashboard. The main workflow is:

Customer → Device intake → Diagnostic checklist → Diagnosis → Parts/cost → Repair → Ready → Delivery → Financial record.

## Current architecture

- Static web app: HTML + CSS + vanilla JavaScript
- Local data: `localStorage`
- Offline cache: `sw.js`
- PWA metadata: `manifest.webmanifest`
- Android wrapper: Capacitor 8.x
- Android target: API 36
- No remote API in v2.0

## Data objects

`profile`: shop identity and technician identity

`jobs`: repair orders and diagnostic state

`customers`: customer records

`parts`: inventory items

`transactions`: income and expenses

`notes`: technician knowledge

`tasks`: work reminders

`activity`: recent local events

## Non-negotiable UX principles

1. The repair workflow must remain the center of the product.
2. Every important action must be usable with one hand on a 360–412px phone.
3. Do not add decorative dashboards that hide the repair workflow.
4. Avoid storing passwords, unlock patterns, PINs or authentication secrets.
5. Keep local mode functional even when offline.
6. Preserve `com.fixora.mobile` once a production package is published.

## Good next features

- Customer WhatsApp message templates
- Invoice / receipt templates
- Repair photo attachments using IndexedDB or Capacitor Filesystem
- Supplier purchase orders
- Part usage linked to repair orders, with automatic stock deduction
- Multiple technicians and permissions
- Optional encrypted cloud backup
- Barcode / QR scanning for SKU
- Analytics: average repair duration, margin by device family, repeat customers
- Warranty tracking and warranty end date
- Device intake signature

## Extension rule

Before adding a feature, ask whether it shortens the technician's path from device intake to diagnosis/repair/delivery. If not, put it behind Tools or Settings rather than the main navigation.
