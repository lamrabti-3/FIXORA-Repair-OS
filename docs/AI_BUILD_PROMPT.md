# FIXORA — prompt for another coding AI

You are taking over an existing app called FIXORA. Treat the repository as a real product, not as a demo.

Product: FIXORA — Mobile Repair Business OS.

Primary users: mobile-phone repair technicians and small repair shops.

Core workflow: customer → device intake → diagnostic checklist → diagnosis → parts/cost → repair → ready → delivery → finance.

Existing features: repair orders with automatic numbers, customer records, 12-point intake checklist, job statuses, priority, due dates, inventory with minimum stock, finance, printable repair tickets, knowledge base, global search, backup/import, PWA offline support, Capacitor Android packaging.

Architecture: HTML/CSS/vanilla JS, localStorage, Service Worker, Capacitor 8.x. Do not replace this with a large framework unless there is a documented technical reason.

Hard requirements:
- Mobile-first 360–412px layouts must remain usable.
- No horizontal scrolling.
- Data must remain local in the offline edition.
- Do not store unlock passwords, PINs, patterns, or authentication secrets.
- Never break backup/import.
- Keep package ID `com.fixora.mobile` unless explicitly instructed otherwise.
- Keep target API 36 for Google Play compatibility.
- Do not remove the diagnostic workflow to add decorative UI.
- Test all CRUD flows after changes.

When implementing a feature, modify the smallest set of files necessary, explain the data model change, and add a migration strategy if stored data could become incompatible.

Before declaring the task complete, check JavaScript syntax, open the app in a browser, test a complete repair flow, test backup/export, test import, verify responsive layout, and verify Android build configuration.
