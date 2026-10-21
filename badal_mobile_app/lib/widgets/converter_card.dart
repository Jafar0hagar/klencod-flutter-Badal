import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/currency.dart';
import '../theme/app_theme.dart';

class ConverterCard extends StatefulWidget {
  final List<Currency> currencies;
  final double francRate;

  const ConverterCard({
    Key? key,
    required this.currencies,
    required this.francRate,
  }) : super(key: key);

  @override
  State<ConverterCard> createState() => _ConverterCardState();
}

class _ConverterCardState extends State<ConverterCard> {
  final TextEditingController _amountController = TextEditingController(text: '100');
  String _selectedCurrencyId = 'usd';

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,###.##');
    final double amount = double.tryParse(_amountController.text) ?? 0.0;

    // Find selected currency or fallback
    final selectedCurrency = widget.currencies.firstWhere(
      (c) => c.id == _selectedCurrencyId,
      orElse: () => widget.currencies.isNotEmpty
          ? widget.currencies.first
          : Currency(id: 'usd', name: 'الدولار الأمريكي', buyPrice: 2700, sellPrice: 2720, change: 'up', updatedAt: 0),
    );

    // Calculations
    final double totalSdg = amount * selectedCurrency.buyPrice;
    final double totalFranc = widget.francRate > 0 ? (totalSdg / widget.francRate) : 0.0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.surface,
            AppTheme.surfaceLight.withOpacity(0.6),
          ],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.goldBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(Icons.calculate_outlined, color: AppTheme.goldLight, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'حاسبة التحويل الفورية',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.goldLight,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.goldPrimary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.goldBorder),
                ),
                child: Text(
                  '1 XAF = ${widget.francRate.toInt()} ج.س',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.goldPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Input & Currency Picker
          Row(
            children: [
              // Amount field
              Expanded(
                flex: 3,
                child: TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  onChanged: (val) => setState(() {}),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                  decoration: InputDecoration(
                    labelText: 'المبلغ المراد تحويله',
                    labelStyle: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                    filled: true,
                    fillColor: AppTheme.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.goldBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.goldPrimary, width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Currency dropdown
              Expanded(
                flex: 2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.goldBorder),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: widget.currencies.any((c) => c.id == _selectedCurrencyId)
                          ? _selectedCurrencyId
                          : (widget.currencies.isNotEmpty ? widget.currencies.first.id : null),
                      isExpanded: true,
                      dropdownColor: AppTheme.surface,
                      items: widget.currencies.map((curr) {
                        return DropdownMenuItem<String>(
                          value: curr.id,
                          child: Text(
                            curr.id.toUpperCase(),
                            style: const TextStyle(
                              color: AppTheme.goldLight,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedCurrencyId = val;
                          });
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Conversion Results
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.background.withOpacity(0.6),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.goldBorder.withOpacity(0.5)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'المقابل بالجنيه السوداني:',
                      style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                    ),
                    Text(
                      '${currencyFormatter.format(totalSdg)} ج.س',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.goldLight,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Divider(color: Color(0x1AFFFFFF), height: 1),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'المقابل بالفرنك التشادي (XAF):',
                      style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                    ),
                    Text(
                      '${currencyFormatter.format(totalFranc)} فرنك',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.greenRate,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
