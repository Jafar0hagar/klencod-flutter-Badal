import 'package:flutter/material.dart';
import '../models/currency.dart';
import '../widgets/currency_card.dart';
import '../theme/app_theme.dart';

class RatesScreen extends StatefulWidget {
  final List<Currency> currencies;
  final double francRate;

  const RatesScreen({
    Key? key,
    required this.currencies,
    required this.francRate,
  }) : super(key: key);

  @override
  State<RatesScreen> createState() => _RatesScreenState();
}

class _RatesScreenState extends State<RatesScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final filteredCurrencies = widget.currencies.where((c) {
      final query = _searchQuery.toLowerCase().trim();
      if (query.isEmpty) return true;
      return c.name.toLowerCase().contains(query) || c.id.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('أسعار صرف العملات'),
      ),
      body: Column(
        children: [
          // Search & Franc Status Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'بحث باسم أو رمز العملة (USD, SAR...)',
                      hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      prefixIcon: const Icon(Icons.search, color: AppTheme.goldLight, size: 18),
                      filled: true,
                      fillColor: AppTheme.surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.goldBorder),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Total Count Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'عدد العملات المتاحة: ${filteredCurrencies.length}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceLight,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppTheme.goldBorder.withOpacity(0.3)),
                  ),
                  child: Text(
                    'الفرنك التشادي: ${widget.francRate.toInt()} ج.س',
                    style: const TextStyle(fontSize: 11, color: AppTheme.goldLight, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),

          // List of Currencies
          Expanded(
            child: filteredCurrencies.isEmpty
                ? Center(
                    child: Text(
                      _searchQuery.isEmpty
                          ? 'جاري تحميل أسعار الصرف...'
                          : 'لم يتم العثور على عملة تطابق "$_searchQuery"',
                      style: const TextStyle(color: AppTheme.textMuted),
                    ),
                  )
                : ListView.builder(
                    itemCount: filteredCurrencies.length,
                    itemBuilder: (context, index) {
                      return CurrencyCard(
                        currency: filteredCurrencies[index],
                        francRate: widget.francRate,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
