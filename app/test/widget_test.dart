import 'package:flutter_test/flutter_test.dart';
import 'package:jaga/main.dart';
import 'package:jaga/screens.dart';

void main() {
  test('19 screens registered', () => expect(screens.length, 19));
  testWidgets('app boots to welcome', (t) async {
    await t.pumpWidget(const JagaApp());
    expect(find.text('Pengenalan'), findsOneWidget);
  });
}
