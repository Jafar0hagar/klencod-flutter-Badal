import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String _keyName = 'badal_user_name';
  static const String _keyPhone = 'badal_user_phone';
  static const String _keyIsLoggedIn = 'badal_is_logged_in';

  String? _userName;
  String? _userPhone;
  bool _isLoggedIn = false;

  String? get userName => _userName;
  String? get userPhone => _userPhone;
  bool get isLoggedIn => _isLoggedIn;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _userName = prefs.getString(_keyName);
    _userPhone = prefs.getString(_keyPhone);
    _isLoggedIn = prefs.getBool(_keyIsLoggedIn) ?? false;
  }

  Future<bool> login(String name, String phone) async {
    if (name.trim().isEmpty || phone.trim().isEmpty) return false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyName, name.trim());
    await prefs.setString(_keyPhone, phone.trim());
    await prefs.setBool(_keyIsLoggedIn, true);

    _userName = name.trim();
    _userPhone = phone.trim();
    _isLoggedIn = true;
    return true;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyName);
    await prefs.remove(_keyPhone);
    await prefs.setBool(_keyIsLoggedIn, false);

    _userName = null;
    _userPhone = null;
    _isLoggedIn = false;
  }
}
