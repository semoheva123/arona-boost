# Arona Boost | أرونا بوست

منصة الترويج والتقييم الرقمي للمنتجعات العالمية والفنادق الفاخرة والمعالم السياحية الشريكة بتسوية فورية عبر USDT (`TRC20` / `BEP20`).

## الرابط الحي على GitHub Pages
- الواجهة التفاعلية المباشرة: `https://semoheva123.github.io/arona-boost/`

## التشغيل على خادم VPS (مع قاعدة البيانات الحية SQLite WAL)

```bash
# 1. تثبيت الحزم
npm install

# 2. التشغيل المعزول عبر PM2 (على المنفذ 3085 وبحد أقصى للذاكرة 280MB)
pm2 start ecosystem.config.cjs
pm2 save
```

## ربط واجهة GitHub Pages بسيرفر الـ VPS الحي
عند الرغبة في ربط رابط GitHub Pages بسيرفر الـ VPS الخاص بك، أضف متغير البيئة `VITE_API_BASE_URL` (مثلاً `https://api.yourdomain.com`) في إعدادات مستودع GitHub (`Settings -> Secrets and variables -> Actions -> Variables`).
