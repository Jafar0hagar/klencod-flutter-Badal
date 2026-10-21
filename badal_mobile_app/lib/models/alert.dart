class UrgentAlert {
  final String id;
  final String title;
  final String text;
  final String time;
  final bool unread;
  final int createdAt;

  UrgentAlert({
    required this.id,
    required this.title,
    required this.text,
    required this.time,
    required this.unread,
    required this.createdAt,
  });

  factory UrgentAlert.fromMap(Map<String, dynamic> data, String id) {
    return UrgentAlert(
      id: id,
      title: data['title'] ?? 'تنبيه عاجل',
      text: data['text'] ?? '',
      time: data['time'] ?? 'الآن',
      unread: data['unread'] ?? true,
      createdAt: data['createdAt'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'text': text,
      'time': time,
      'unread': unread,
      'createdAt': createdAt,
    };
  }
}
