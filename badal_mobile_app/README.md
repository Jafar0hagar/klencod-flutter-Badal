# تطبيق بَدَلْ (BADAL) للهواتف المحمولة — Flutter & Dart 📱

تطبيق هاتف محمول أصلي مكتوب بلغة **Flutter و Dart** فقط وبشكل صارم، مخصص لمتابعة أسعار صرف العملات والسلع التموينية في السوق الموازي، وحساب التحويلات بالجنيه السوداني والفرنك التشادي، وتلقي التنبيهات المباشرة.

مشروع فلاتر جاهز بالكامل للبناء عبر **GitHub Actions CI/CD** وتوليد ملف APK جاهز للتثبيت دون الحاجة لتثبيت بيئة أندرويد محلياً.

---

## ⚡ البناء التلقائي عبر GitHub (GitHub Actions CI/CD):

هذا المشروع يحتوي على مسار عمل جاهز في `.github/workflows/build_apk.yml` للبناء التلقائي على خوادم GitHub:

### خطوات الرفع على GitHub:
```bash
# 1. الدخول إلى مجلد التطبيق
cd badal_mobile_app

# 2. تهيئة مستودع Git
git init
git add .
git commit -m "Initial commit for Badal Flutter App"

# 3. ربطه بمستودعك على GitHub
git branch -M main
git remote add origin https://github.com/USERNAME/badal_mobile_app.git

# 4. الرفع
git push -u origin main
```

### كيف تستلم ملف الـ APK؟
1. افتح صفحة مستودعك على GitHub.
2. اضغط على تبويب **Actions** في الأعلى.
3. ستجد سير العمل **Build Badal Flutter APK** بدأ تلقائياً.
4. بعد اكتمال البناء (خلال دقيقتين إلى 3 دقائق)، اضغط على البناء المكتمل.
5. في قسم **Artifacts** بالأسفل، ستجد ملف **`badal-app-release.apk`** جاهزاً للتنزيل والتثبيت مباشرة على أي هاتف أندرويد!

---

## 🚀 المميزات الرئيسية للتطبيق:
1. **تزامن سحابي فوري ومباشر**:
   - يرتبط مباشرة بقاعدة بيانات Google Firebase Firestore المشتركة (`ai-studio-2c8954e1-0131-4d50-aa68-8d6bf61d2bc8`) عبر الـ Streams الحية (`onSnapshot`).
   - تنعكس التحديثات الصادرة من لوحة تحكم المشرف (Badal Admin Dashboard) في أجزاء من الثانية.
2. **شريط أسعار الصرف الحي**:
   - أسعار البيع والشراء لجميع العملات (USD, SAR, AED, EGP, XAF).
   - مؤشرات الصعود والهبوط المباشرة.
3. **حاسبة التحويل التلقائية**:
   - تحويل فوري لأي مبلغ بين العملات والجنيه والفرنك التشادي.
4. **سوق السلع التموينية بالجملة**:
   - سكر كنانة، دقيق سيقا، زيوت طعام، وأرز.
   - حالة المخزون (متوفر / غير متوفر) وإرسال طلبات الشراء بضغطة زر.
5. **نظام بث التنبيهات العاجلة**:
   - إشعارات فورية مع رنين تنبيهي عند قيام المشرف ببث أي تحديث عاجل.
6. **هوية بصرية فاخرة**:
   - تصميم أسود فاحم وذهبي (Slate & Amber/Gold) مخصص للأجهزة الذكية مع دعم كامل للغة العربية (RTL).

---

## 🛠️ البناء والتشغيل المحلي (اختياري):

```bash
# تثبيت الحزم
flutter pub get

# تشغيل على المحاكي أو الهاتف
flutter run

# بناء ملف APK محلياً
flutter build apk --release --no-tree-shake-icons
# المسار: build/app/outputs/flutter-apk/app-release.apk

# بناء App Bundle لمتجر Google Play
flutter build appbundle --release
```

---

## 📂 هيكلية ومسارات الملفات المنسقة:
```
badal_mobile_app/
├── .github/
│   └── workflows/
│       └── build_apk.yml            # سير عمل GitHub Actions لبناء APK
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   # أذونات وإعدادات نظام أندرويد
│   │   │   ├── kotlin/com/badal/app/MainActivity.kt
│   │   │   └── res/values/styles.xml
│   │   ├── build.gradle              # إعدادات حزمة الأندرويد com.badal.app
│   │   └── google-services.json      # ملف ربط Firebase أندرويد
│   ├── build.gradle                  # إعدادات Gradle الرئيسية
│   ├── settings.gradle               # ملحقات فلاتر وأندرويد
│   └── gradle.properties
├── lib/
│   ├── models/                       # نماذج بيانات العملات، السلع، الطلبات، والتنبيهات
│   │   ├── alert.dart
│   │   ├── currency.dart
│   │   ├── order.dart
│   │   └── product.dart
│   ├── screens/                      # شاشات التطبيق الكاملة
│   │   ├── alerts_screen.dart
│   │   ├── home_screen.dart
│   │   ├── login_screen.dart
│   │   ├── products_screen.dart
│   │   ├── rates_screen.dart
│   │   └── splash_screen.dart
│   ├── services/                     # خدمات Firestore و SharedPreferences
│   │   ├── auth_service.dart
│   │   └── firestore_service.dart
│   ├── theme/                        # الثيم الذهبي والأسود الداكن
│   │   └── app_theme.dart
│   ├── widgets/                      # البطاقات التفاعلية والحاسبة
│   │   ├── converter_card.dart
│   │   ├── currency_card.dart
│   │   ├── order_dialog.dart
│   │   └── product_card.dart
│   └── main.dart                     # نقطة الانطلاق الرئيسية والتنقل
├── assets/                           # مجلد الصور والأصوات
├── analysis_options.yaml             # قواعد كود Dart
├── pubspec.yaml                      # تعريف الحزم والتبعيات
└── README.md                         # دليل التشغيل والرفع على GitHub
```
