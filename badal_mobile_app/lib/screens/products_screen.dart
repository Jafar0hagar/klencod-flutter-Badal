import 'package:flutter/material.dart';
import '../models/product.dart';
import '../widgets/product_card.dart';
import '../widgets/order_dialog.dart';
import '../theme/app_theme.dart';
import '../services/auth_service.dart';

class ProductsScreen extends StatefulWidget {
  final List<Product> products;
  final double francRate;
  final AuthService authService;
  final VoidCallback onRequestLogin;

  const ProductsScreen({
    Key? key,
    required this.products,
    required this.francRate,
    required this.authService,
    required this.onRequestLogin,
  }) : super(key: key);

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  String _selectedCategory = 'all';

  final List<Map<String, String>> _categories = [
    {'id': 'all', 'label': 'جميع السلع'},
    {'id': 'sugar', 'label': 'السكر'},
    {'id': 'flour', 'label': 'الدقيق'},
    {'id': 'oil', 'label': 'الزيوت'},
    {'id': 'other', 'label': 'سلع أخرى'},
  ];

  void _handleOrderClick(Product product) {
    // If not logged in, prompt customer to enter name/phone or login
    showDialog(
      context: context,
      builder: (context) => OrderDialog(
        product: product,
        initialName: widget.authService.userName,
        initialPhone: widget.authService.userPhone,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredProducts = widget.products.where((p) {
      if (_selectedCategory == 'all') return true;
      return p.category == _selectedCategory;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('السلع التموينية والمخزون'),
      ),
      body: Column(
        children: [
          // Category Selector Pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: _categories.map((cat) {
                final isSelected = _selectedCategory == cat['id'];
                return Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: FilterChip(
                    selected: isSelected,
                    label: Text(
                      cat['label']!,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.black : AppTheme.textSecondary,
                      ),
                    ),
                    backgroundColor: AppTheme.surface,
                    selectedColor: AppTheme.goldPrimary,
                    checkmarkColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isSelected ? AppTheme.goldPrimary : AppTheme.goldBorder,
                      ),
                    ),
                    onSelected: (selected) {
                      setState(() {
                        _selectedCategory = cat['id']!;
                      });
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          // Grid of Products
          Expanded(
            child: filteredProducts.isEmpty
                ? Center(
                    child: Text(
                      widget.products.isEmpty
                          ? 'جاري مزامنة السلع مع الخادم...'
                          : 'لا توجد سلع متوفرة في هذا القسم حالياً',
                      style: const TextStyle(color: AppTheme.textMuted),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.68,
                    ),
                    itemCount: filteredProducts.length,
                    itemBuilder: (context, index) {
                      final product = filteredProducts[index];
                      return ProductCard(
                        product: product,
                        francRate: widget.francRate,
                        onOrder: () => _handleOrderClick(product),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
