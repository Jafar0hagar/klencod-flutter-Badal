class Product {
  final String id;
  final String name;
  final double price;
  final String unit;
  final String category; // 'sugar', 'flour', 'oil', 'other'
  final bool inStock;
  final String image;

  Product({
    required this.id,
    required this.name,
    required this.price,
    required this.unit,
    required this.category,
    required this.inStock,
    required this.image,
  });

  factory Product.fromMap(Map<String, dynamic> data, String id) {
    return Product(
      id: id,
      name: data['name'] ?? '',
      price: (data['price'] is num) ? (data['price'] as num).toDouble() : 0.0,
      unit: data['unit'] ?? '',
      category: data['category'] ?? 'other',
      inStock: data['inStock'] ?? true,
      image: data['image'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'price': price,
      'unit': unit,
      'category': category,
      'inStock': inStock,
      'image': image,
    };
  }
}
