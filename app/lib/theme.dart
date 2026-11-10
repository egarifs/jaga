import 'package:flutter/material.dart';

// Design tokens from AGENTS.md. Font: Plus Jakarta Sans (add via google_fonts/assets when licensed offline).
class Tokens {
  static const primary = Color(0xFF3F6B55), primaryHover = Color(0xFF2C4D3D);
  static const bg = Color(0xFFF6F4EE), card = Colors.white, line = Color(0xFFE4E1D8);
  static const text = Color(0xFF1F2A24), textSecondary = Color(0xFF5F6962);
  static const danger = Color(0xFFB42318), dangerBg = Color(0xFFFDECEA);
  static const stock = Color(0xFF8A4215), stockBg = Color(0xFFFBEBDD);
  static const info = Color(0xFF2F5D8A), infoBg = Color(0xFFE5EEF7);
  static const minTouch = 44.0, tabBarHeight = 84.0;
}

ThemeData jagaTheme() => ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: Tokens.primary, primary: Tokens.primary, surface: Tokens.card),
      scaffoldBackgroundColor: Tokens.bg,
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(minimumSize: const Size(Tokens.minTouch, Tokens.minTouch)),
      ),
    );
