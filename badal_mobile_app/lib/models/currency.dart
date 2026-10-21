class Currency {
  final String id;
  final String name;
  final double buyPrice;
  final double sellPrice;
  final String change; // 'up', 'down', 'stable'
  final int updatedAt;

  Currency({
    required this.id,
    required this.name,
    required this.buyPrice,
    required this.sellPrice,
    required this.change,
    required this.updatedAt,
  });

  factory Currency.fromMap(Map<String, dynamic> data, String id) {
    return Currency(
      id: id,
      name: data['name'] ?? '',
      buyPrice: (data['buyPrice'] is num) ? (data['buyPrice'] as num).toDouble() : 0.0,
      sellPrice: (data['sellPrice'] is num) ? (data['sellPrice'] as num).toDouble() : 0.0,
      change: data['change'] ?? 'stable',
      updatedAt: data['updatedAt'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'buyPrice': buyPrice,
      'sellPrice': sellPrice,
      'change': change,
      'updatedAt': updatedAt,
    };
  }
}
