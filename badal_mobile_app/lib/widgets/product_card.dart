import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/product.dart';
import '../theme/app_theme.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final double francRate;
  final VoidCallback onOrder;

  const ProductCard({
    Key? key,
    required this.product,
    required this.francRate,
    required this.onOrder,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,###');
    final double francPrice = francRate > 0 ? (product.price / francRate) : 0;

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: product.inStock ? AppTheme.goldBorder : Colors.red.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Tag / Category & Stock
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: product.inStock
                        ? AppTheme.greenRate.withOpacity(0.15)
                        : AppTheme.redRate.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: product.inStock
                          ? AppTheme.greenRate.withOpacity(0.3)
                          : AppTheme.redRate.withOpacity(0.3),
                    ),
                  ),
                  child: Text(
                    product.inStock ? 'متوفر بالمخزون' : 'نفذت الكمية',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: product.inStock ? AppTheme.greenRate : AppTheme.redRate,
                    ),
                  ),
                ),
                Text(
                  product.unit,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          // Product Icon / Visual Box
          Container(
            height: 70,
            width: double.infinity,
            margin: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppTheme.surfaceLight.withOpacity(0.4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.goldBorder.withOpacity(0.3)),
            ),
            child: Center(
              child: Icon(
                _getCategoryIcon(product.category),
                size: 34,
                color: AppTheme.goldPrimary,
              ),
            ),
          ),

          const SizedBox(height: 10),

          // Product Name & Prices
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      '${currencyFormatter.format(product.price)} ج.س',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.goldLight,
                      ),
                    ),
                  ],
                ),
                Text(
                  '≈ ${currencyFormatter.format(francPrice.round())} فرنك',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),

          const Spacer(),

          // Order Button
          Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity,
              height: 38,
              child: ElevatedButton(
                onPressed: product.inStock ? onOrder : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.goldPrimary,
                  foregroundColor: Colors.black,
                  disabledBackgroundColor: Colors.white10,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.shopping_cart_outlined, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'طلب شراء',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'sugar':
        return Icons.grain;
      case 'flour':
        return Icons.bakery_dining;
      case 'oil':
        return Icons.water_drop;
      default:
        return Icons.inventory_2_outlined;
    }
  }
}
