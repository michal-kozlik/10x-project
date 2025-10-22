W tym repozytorium stosuj styl C#: jednoliniowe bloki sterujące bez klamer. Dotyczy if/else/for/while/foreach/using. Przykład:
if (x == null)
throw new ArgumentNullException(nameof(x));
a nie:
if (x == null)
{
throw new ArgumentNullException(nameof(x));
}
Jeśli blok staje się wieloliniowy — użyj klamer. Zgodność z .editorconfig. Przy refaktoryzacjach usuwaj zbędne klamry (preferowane automatyczne fixy Roslynatora: RCS1002/RCS1004).
