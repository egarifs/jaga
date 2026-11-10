import 'package:flutter/material.dart';
import 'screens.dart';
import 'theme.dart';

void main() => runApp(const JagaApp());

class JagaApp extends StatelessWidget {
  const JagaApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Jaga',
        theme: jagaTheme(),
        initialRoute: '/welcome',
        routes: {for (final s in screens) s.$1: (_) => PendingScreen(s.$2, s.$3)},
      );
}

class PendingScreen extends StatelessWidget {
  const PendingScreen(this.title, this.fr, {super.key});
  final String title, fr;
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(title)),
        body: Center(child: Text('$fr — belum dibangun')),
      );
}
