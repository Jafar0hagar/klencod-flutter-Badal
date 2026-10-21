import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';

import 'theme/app_theme.dart';
import 'models/currency.dart';
import 'models/product.dart';
import 'models/alert.dart';
import 'services/firestore_service.dart';
import 'services/auth_service.dart';

import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/rates_screen.dart';
import 'screens/products_screen.dart';
import 'screens/alerts_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Note: Firebase.initializeApp() connects using google-services.json on Android / iOS
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase init notice: $e');
  }

  final authService = AuthService();
  await authService.init();

  runApp(BadalApp(authService: authService));
}

class BadalApp extends StatelessWidget {
  final AuthService authService;

  const BadalApp({Key? key, required this.authService}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'بَدَلْ - أسعار الصرف والسلع',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      locale: const Locale('ar', 'SD'),
      supportedLocales: const [
        Locale('ar', 'SD'),
        Locale('ar', ''),
        Locale('en', ''),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: AppRoot(authService: authService),
    );
  }
}

class AppRoot extends StatefulWidget {
  final AuthService authService;

  const AppRoot({Key? key, required this.authService}) : super(key: key);

  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  bool _showSplash = true;
  bool _forceLogin = false;
  int _currentIndex = 0;

  final FirestoreService _firestoreService = FirestoreService();

  List<Currency> _currencies = [];
  List<Product> _products = [];
  List<UrgentAlert> _alerts = [];
  double _francRate = 5900;

  @override
  void initState() {
    super.initState();

    // Subscribe to Firestore Real-time Streams
    _firestoreService.getCurrenciesStream().listen((list) {
      if (mounted) setState(() => _currencies = list);
    });

    _firestoreService.getProductsStream().listen((list) {
      if (mounted) setState(() => _products = list);
    });

    _firestoreService.getAlertsStream().listen((list) {
      if (mounted) setState(() => _alerts = list);
    });

    _firestoreService.getFrancRateStream().listen((rate) {
      if (mounted) setState(() => _francRate = rate);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_showSplash) {
      return SplashScreen(
        onFinish: () {
          setState(() {
            _showSplash = false;
          });
        },
      );
    }

    if (_forceLogin && !widget.authService.isLoggedIn) {
      return LoginScreen(
        authService: widget.authService,
        onLoginSuccess: () {
          setState(() {
            _forceLogin = false;
          });
        },
        onContinueAsGuest: () {
          setState(() {
            _forceLogin = false;
          });
        },
      );
    }

    final screens = [
      HomeScreen(
        currencies: _currencies,
        alerts: _alerts,
        francRate: _francRate,
        authService: widget.authService,
        onNavigateToRates: () => setState(() => _currentIndex = 1),
        onNavigateToProducts: () => setState(() => _currentIndex = 2),
        onNavigateToAlerts: () => setState(() => _currentIndex = 3),
      ),
      RatesScreen(
        currencies: _currencies,
        francRate: _francRate,
      ),
      ProductsScreen(
        products: _products,
        francRate: _francRate,
        authService: widget.authService,
        onRequestLogin: () => setState(() => _forceLogin = true),
      ),
      AlertsScreen(
        alerts: _alerts,
      ),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppTheme.goldBorder, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'الرئيسية',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.currency_exchange),
              activeIcon: Icon(Icons.currency_exchange),
              label: 'العملات',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.shopping_basket_outlined),
              activeIcon: Icon(Icons.shopping_basket),
              label: 'السلع',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.campaign_outlined),
              activeIcon: Icon(Icons.campaign),
              label: 'التنبيهات',
            ),
          ],
        ),
      ),
    );
  }
}
