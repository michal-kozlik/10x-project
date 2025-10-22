# Schemat bazy danych

## Tabele

### users

Tabela zarządzana przez Supabase Auth.

| Kolumna      | Typ          | Ograniczenia            |
| ------------ | ------------ | ----------------------- |
| id           | bigserial    | PRIMARY KEY             |
| email        | varchar(255) | NOT NULL, UNIQUE        |
| created_at   | timestamptz  | NOT NULL, DEFAULT now() |
| confirmed_at | timestamptz  | NULL                    |

### diagrams

Tabela przechowująca diagramy sudoku użytkowników.

| Kolumna    | Typ           | Ograniczenia                                     |
| ---------- | ------------- | ------------------------------------------------ |
| id         | bigserial     | PRIMARY KEY                                      |
| definition | varchar(100)  | NOT NULL                                         |
| solution   | varchar(100)  | NULL                                             |
| name       | varchar(1000) | NULL                                             |
| created_at | timestamptz   | NOT NULL, DEFAULT now()                          |
| user_id    | bigserial     | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |

## Klucze

### Klucze podstawowe

- `PK_users` na tabeli `users(id)`
- `PK_diagrams` na tabeli `diagrams(id)`

### Klucze obce

- `FK_diagrams_user` na tabeli `diagrams(user_id)` odnoszący się do `users(id)`

## Indeksy

### diagrams

- `IX_diagrams_user_id` na kolumnie `user_id` - optymalizacja zapytań filtrujących po użytkowniku

## Row Level Security (RLS)

### diagrams

```sql
-- Włączenie RLS dla tabeli diagrams
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

-- Polityka dostępu dla właściciela diagramu
CREATE POLICY "Użytkownicy widzą tylko swoje diagramy"
ON diagrams
FOR ALL
USING (auth.uid() = user_id);
```

## Dodatkowe uwagi

1. Walidacja i ograniczenia:
   - Maksymalna liczba diagramów (100) per użytkownik jest egzekwowana w logice backendu
   - Kolumna `definition` i `solution` przechowują dane sudoku w formacie ciągu znaków o długości 100 (9x9 plansza + separatory)
   - Kolumna `name` pozwala na długie nazwy diagramów (do 1000 znaków) dla elastyczności

2. Optymalizacja:
   - Indeks na `user_id` wspiera szybkie wyszukiwanie diagramów użytkownika
   - Kaskadowe usuwanie diagramów przy usunięciu użytkownika (ON DELETE CASCADE)

3. Bezpieczeństwo:
   - RLS zapewnia izolację danych między użytkownikami
   - Dostęp do tabeli `users` jest zarządzany przez Supabase Auth
   - Wszystkie operacje CRUD na diagramach wymagają uwierzytelnienia

4. Skalowalność:
   - Schemat jest znormalizowany do 3NF
   - Brak potrzeby partycjonowania dla MVP
   - Proste relacje one-to-many ułatwiają przyszłe rozszerzenia
