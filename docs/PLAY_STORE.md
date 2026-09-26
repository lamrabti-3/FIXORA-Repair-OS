# FIXORA — Google Play release checklist

## Product identity

App name: FIXORA
Category: Business / Tools (choose the category that best matches the final product)
Primary audience: mobile-phone repair technicians and small repair shops
Package: `com.fixora.mobile`

## Required build format

Use a **signed Android App Bundle (`.aab`)** for the Google Play production release.

The current repository is configured to target **API 36 / Android 16**, which is the current minimum target for new app submissions and updates as of 31 August 2026.

## Store copy draft

### Short description

إدارة احترافية لإصلاح الهواتف والعملاء والقطع والأرباح.

### Full description

FIXORA هو نظام عمل مصمم لفنيي ومحلات إصلاح الهواتف.

تابع كل جهاز من لحظة الاستلام حتى التسليم، احفظ العطل والتشخيص والحل، سجل العميل، راقب أسعار القطع والمخزون، واحسب ربح كل عملية.

المزايا الأساسية:
- أوامر إصلاح بأرقام تلقائية
- فحص استلام من 12 نقطة
- حالات إصلاح واضحة من الاستلام إلى التسليم
- ملفات العملاء وتاريخ الأجهزة
- مخزون قطع مع حد أدنى وتنبيهات
- دخل ومصاريف وربح
- طباعة تذكرة الإصلاح
- قاعدة معرفة للحلول والملاحظات
- بحث شامل
- نسخ احتياطي واستيراد للبيانات
- العمل محلياً بدون حساب سحابي في الإصدار الأول

## Before submission

Replace the placeholder support contact in `privacy-policy.html` with a real support email.

Host `privacy-policy.html` at a public HTTPS URL and enter that URL in Play Console.

Complete the Play Console Data Safety form truthfully for the exact production binary. Google states that data only accessed on-device and not sent off-device may not need to be declared as collected, but the declaration must match the actual app behavior.

For a new personal developer account created after 13 November 2023, complete the required closed test with at least 12 opted-in testers continuously for 14 days before requesting production access.

The Play Console account owner must be at least 18 years old.
