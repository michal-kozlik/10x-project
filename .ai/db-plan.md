# Schemat bazy danych

## Tabele

### users
Tabela zarządzana przez Supabase Auth.

| Kolumna         | Typ          | Ograniczenia                    |
|----------------|--------------|--------------------------------|
| Id             | bigserial    | PRIMARY KEY                    |
| Email          | varchar(255) | NOT NULL, UNIQUE               |
| CreatedAt      | timestamptz  | NOT NULL, DEFAULT now()        |
| ConfirmedAt    | timestamptz  | NULL                          |

### diagrams
Tabela przechowująca diagramy sudoku użytkowników.

| Kolumna       | Typ          | Ograniczenia                                        |
|--------------|--------------|---------------------------------------------------|
| Id           | bigserial    | PRIMARY KEY                                       |
| Definition   | varchar(100) | NOT NULL                                          |
| Solution     | varchar(100) | NULL                                              |
| Name         | varchar(1000)| NULL                                              |
| CreatedAt    | timestamptz  | NOT NULL, DEFAULT now()                          |
| UserId       | bigserial    | NOT NULL, REFERENCES users(Id) ON DELETE CASCADE  |

## Klucze

### Klucze podstawowe
- `PK_users` na tabeli `users(Id)`
- `PK_diagrams` na tabeli `diagrams(Id)`

### Klucze obce
- `FK_diagrams_user` na tabeli `diagrams(UserId)` odnoszący się do `users(Id)`

## Indeksy

### diagrams
- `IX_diagrams_UserId` na kolumnie `UserId` - optymalizacja zapytań filtrujących po użytkowniku
- `IX_diagrams_CreatedAt` na kolumnie `CreatedAt` - optymalizacja sortowania po dacie utworzenia

## Row Level Security (RLS)

### diagrams
```sql
-- Włączenie RLS dla tabeli diagrams
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

-- Polityka dostępu dla właściciela diagramu
CREATE POLICY "Użytkownicy widzą tylko swoje diagramy"
ON diagrams
FOR ALL
USING (auth.uid() = UserId);
```

## Dodatkowe uwagi

1. Walidacja i ograniczenia:
   - Maksymalna liczba diagramów (100) per użytkownik jest egzekwowana w logice backendu
   - Kolumna `Definition` i `Solution` przechowują dane sudoku w formacie ciągu znaków o długości 100 (9x9 plansza + separatory)
   - Kolumna `Name` pozwala na długie nazwy diagramów (do 1000 znaków) dla elastyczności

2. Optymalizacja:
   - Indeks na `UserId` wspiera szybkie wyszukiwanie diagramów użytkownika
   - Indeks na `CreatedAt` wspiera sortowanie chronologiczne
   - Kaskadowe usuwanie diagramów przy usunięciu użytkownika (ON DELETE CASCADE)

3. Bezpieczeństwo:
   - RLS zapewnia izolację danych między użytkownikami
   - Dostęp do tabeli `users` jest zarządzany przez Supabase Auth
   - Wszystkie operacje CRUD na diagramach wymagają uwierzytelnienia

4. Skalowalność:
   - Schemat jest znormalizowany do 3NF
   - Brak potrzeby partycjonowania dla MVP
   - Proste relacje one-to-many ułatwiają przyszłe rozszerzenia