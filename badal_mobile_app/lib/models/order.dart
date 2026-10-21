class OrderItem {
  final String id;
  final String productName;
  final String price;
  final String unit;
  final String customerName;
  final String customerPhone;
  final String notes;
  final String status; // 'pending', 'completed', 'cancelled'
  final String timestamp;
  final int createdAt;

  OrderItem({
    required this.id,
    required this.productName,
    required this.price,
    required this.unit,
    required this.customerName,
    required this.customerPhone,
    required this.notes,
    required this.status,
    required this.timestamp,
    required this.createdAt,
  });

  factory OrderItem.fromMap(Map<String, dynamic> data, String id) {
    return OrderItem(
      id: id,
      productName: data['productName'] ?? '',
      price: data['price']?.toString() ?? '0',
      unit: data['unit'] ?? '',
      customerName: data['customerName'] ?? '',
      customerPhone: data['customerPhone'] ?? '',
      notes: data['notes'] ?? '',
      status: data['status'] ?? 'pending',
      timestamp: data['timestamp'] ?? 'الآن',
      createdAt: data['createdAt'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'productName': productName,
      'price': price,
      'unit': unit,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'notes': notes,
      'status': status,
      'timestamp': timestamp,
      'createdAt': createdAt,
    };
  }
}
