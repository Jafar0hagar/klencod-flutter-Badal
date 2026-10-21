import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/currency.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../models/alert.dart';

class FirestoreService {
  // Using the shared Firestore project database
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Currencies Real-time Stream
  Stream<List<Currency>> getCurrenciesStream() {
    return _db.collection('currencies').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Currency.fromMap(doc.data(), doc.id)).toList();
    });
  }

  // Products Real-time Stream
  Stream<List<Product>> getProductsStream() {
    return _db.collection('products').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => Product.fromMap(doc.data(), doc.id)).toList();
    });
  }

  // Urgent Alerts Real-time Stream
  Stream<List<UrgentAlert>> getAlertsStream() {
    return _db
        .collection('alerts')
        .orderBy('createdAt', descending: true)
        .limit(20)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => UrgentAlert.fromMap(doc.data(), doc.id)).toList();
    });
  }

  // Chad Franc Pivot Rate Stream (from config/general)
  Stream<double> getFrancRateStream() {
    return _db.collection('config').doc('general').snapshots().map((snapshot) {
      if (snapshot.exists && snapshot.data() != null) {
        final data = snapshot.data()!;
        final rate = data['francRate'] ?? data['rate'] ?? 5900;
        return (rate is num) ? rate.toDouble() : 5900.0;
      }
      return 5900.0;
    });
  }

  // WhatsApp Configuration Stream (from config/whatsapp)
  Stream<Map<String, dynamic>> getWhatsAppConfigStream() {
    return _db.collection('config').doc('whatsapp').snapshots().map((snapshot) {
      if (snapshot.exists && snapshot.data() != null) {
        return snapshot.data()!;
      }
      return {
        'salesPhone1': '+249 91 234 5678',
        'salesPhone2': '+249 92 345 6789',
        'supportPhone': '+249 93 456 7890',
        'waLink': 'https://wa.me/249912345678',
      };
    });
  }

  // Submit Order from Flutter Client to Firestore
  Future<void> submitOrder(OrderItem order) async {
    await _db.collection('orders').doc(order.id).set(order.toMap());
  }

  // User Orders Stream for specific customer phone
  Stream<List<OrderItem>> getCustomerOrdersStream(String customerPhone) {
    return _db
        .collection('orders')
        .where('customerPhone', isEqualTo: customerPhone)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => OrderItem.fromMap(doc.data(), doc.id)).toList();
    });
  }
}
