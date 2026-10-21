import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/currency.dart';
import '../theme/app_theme.dart';

class CurrencyCard extends StatelessWidget {
  final Currency currency;
  final double francRate;

  const CurrencyCard({
    Key? key,
    required this.currency,
    this.francRate = 5900,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,###');
    
    // Status color & icon
    Color statusColor = AppTheme.goldPrimary;
    IconData statusIcon = Icons.remove;
    if (currency.change == 'up') {
      statusColor = AppTheme.greenRate;
      statusIcon = Icons.arrow_upward;
    } else if (currency.change == 'down') {
      statusColor = AppTheme.redRate;
      statusIcon = Icons.arrow_downward;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.goldBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.goldPrimary.withOpacity(0.12),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.goldBorder),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      currency.id.toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.goldLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        currency.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        'كود: ${currency.id.toUpperCase()}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(statusIcon, size: 14, color: statusColor),
                    const SizedBox(width: 4),
                    Text(
                      currency.change == 'up'
                          ? 'صعود'
                          : (currency.change == 'down' ? 'هبوط' : 'مستقر'),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(color: Color(0x1AFFFFFF), height: 1),
          const SizedBox(height: 12),
          // Buy & Sell Columns
          Row(
            children: [
              // Buy Price
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceLight.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'سعر الشراء (ج.س)',
                        style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        currencyFormatter.format(currency.buyPrice),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Sell Price
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                  decoration: BoxDecoration(
                    color: AppTheme.goldPrimary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.goldBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'سعر البيع (ج.س)',
                        style: TextStyle(fontSize: 11, color: AppTheme.goldLight),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        currencyFormatter.format(currency.sellPrice),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.goldLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
