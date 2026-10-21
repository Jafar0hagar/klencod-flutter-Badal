import 'package:flutter/material.dart';
import '../models/currency.dart';
import '../models/alert.dart';
import '../widgets/converter_card.dart';
import '../widgets/currency_card.dart';
import '../theme/app_theme.dart';
import '../services/auth_service.dart';

class HomeScreen extends StatelessWidget {
  final List<Currency> currencies;
  final List<UrgentAlert> alerts;
  final double francRate;
  final AuthService authService;
  final VoidCallback onNavigateToRates;
  final VoidCallback onNavigateToProducts;
  final VoidCallback onNavigateToAlerts;

  const HomeScreen({
    Key? key,
    required this.currencies,
    required this.alerts,
    required this.francRate,
    required this.authService,
    required this.onNavigateToRates,
    required this.onNavigateToProducts,
    required this.onNavigateToAlerts,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Top 3 Currencies
    final topCurrencies = currencies.take(3).toList();
    final latestAlert = alerts.isNotEmpty ? alerts.first : null;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.goldPrimary,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'بَدَلْ',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'BADAL MARKET',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
        actions: [
          // Live Sync Indicator
          Container(
            margin: const EdgeInsets.only(left: 14),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.greenRate.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.greenRate.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(
                    color: AppTheme.greenRate,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                const Text(
                  'مباشر',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppTheme.greenRate,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Firestore streams update in real-time, dummy delay for UX
          await Future.delayed(const Duration(milliseconds: 400));
        },
        color: AppTheme.goldPrimary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Greeting Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          authService.isLoggedIn
                              ? 'مرحباً، ${authService.userName}'
                              : 'مرحباً بك كزائر',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        Text(
                          'تحديث فوري لأسعار الصرف والسوق الموازي',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                    if (alerts.isNotEmpty)
                      IconButton(
                        icon: Stack(
                          children: [
                            const Icon(Icons.notifications_active_outlined, color: AppTheme.goldLight),
                            Positioned(
                              top: 0,
                              right: 0,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppTheme.redRate,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ],
                        ),
                        onPressed: onNavigateToAlerts,
                      ),
                  ],
                ),
              ),

              // Urgent Alert Banner if present
              if (latestAlert != null)
                GestureDetector(
                  onTap: onNavigateToAlerts,
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppTheme.goldPrimary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.goldBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.campaign, color: AppTheme.goldPrimary, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            latestAlert.text,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.goldLight,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios, color: AppTheme.goldLight, size: 12),
                      ],
                    ),
                  ),
                ),

              // Instant Currency Converter Card
              ConverterCard(
                currencies: currencies,
                francRate: francRate,
              ),

              // Section Header: Top Currencies
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'أبرز أسعار الصرف الحية',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    TextButton(
                      onPressed: onNavigateToRates,
                      child: const Text(
                        'عرض الكل',
                        style: TextStyle(
                          color: AppTheme.goldLight,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Currency Cards
              if (topCurrencies.isEmpty)
                Container(
                  margin: const EdgeInsets.all(20),
                  padding: const EdgeInsets.all(24),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text(
                    'جاري استقبال بيانات العملات من الخادم...',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                )
              else
                ...topCurrencies.map((curr) => CurrencyCard(currency: curr, francRate: francRate)),

              // Quick Action: Commodities Market
              GestureDetector(
                onTap: onNavigateToProducts,
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.goldBorder),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.goldPrimary.withOpacity(0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.shopping_basket, color: AppTheme.goldLight, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'سوق السلع التموينية بالجملة',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            SizedBox(height: 3),
                            Text(
                              'سكر كنانة، دقيق سيقا، زيوت طعام وأرز بأسعار اليوم المباشرة',
                              style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, color: AppTheme.goldLight, size: 14),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
