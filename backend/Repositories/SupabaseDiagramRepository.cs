using Npgsql;
using System.Data;

namespace SudokuApi.Repositories
{
    public sealed class SupabaseDiagramRepository : IDiagramRepository
    {
        private readonly string _connectionString;

        public SupabaseDiagramRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("SupabaseDb")
                ?? throw new InvalidOperationException("Connection string 'SupabaseDb' is not configured.");
        }

        public async Task<(IReadOnlyList<DiagramRecord> Items, int Total)> ListAsync(
            string userId,
            int page,
            int limit,
            string? sortBy,
            string? filter,
            CancellationToken cancellationToken)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(cancellationToken);

            var whereClauses = new List<string>();
            var parameters = new List<NpgsqlParameter>();

            // If you later add auth, you can filter user_id here. For now, show all diagrams.
            if (!string.IsNullOrWhiteSpace(filter))
            {
                whereClauses.Add("name ILIKE @filter");
                parameters.Add(new NpgsqlParameter("@filter", NpgsqlTypes.NpgsqlDbType.Text) { Value = "%" + filter + "%" });
            }

            var whereSql = whereClauses.Count > 0 ? ("WHERE " + string.Join(" AND ", whereClauses)) : string.Empty;

            var orderBy = sortBy switch
            {
                "name" => "ORDER BY name ASC",
                "id" => "ORDER BY id ASC",
                _ => "ORDER BY created_at DESC"
            };

            var offset = (page - 1) * limit;

            var sql = $@"
                SELECT id, name, definition, solution, created_at
                FROM diagrams
                {whereSql}
                {orderBy}
                LIMIT @limit OFFSET @offset;

                SELECT COUNT(*) FROM diagrams {whereSql};";

            await using var cmd = new NpgsqlCommand(sql, conn);
            foreach (var p in parameters)
            {
                cmd.Parameters.Add(p);
            }
            cmd.Parameters.Add(new NpgsqlParameter("@limit", NpgsqlTypes.NpgsqlDbType.Integer) { Value = limit });
            cmd.Parameters.Add(new NpgsqlParameter("@offset", NpgsqlTypes.NpgsqlDbType.Integer) { Value = offset });

            var items = new List<DiagramRecord>();
            int total = 0;

            await using var reader = await cmd.ExecuteReaderAsync(CommandBehavior.SequentialAccess, cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var record = new DiagramRecord
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                    Definition = reader.GetString(2),
                    Solution = reader.IsDBNull(3) ? null : reader.GetString(3),
                    CreatedAt = reader.GetFieldValue<DateTime>(4).ToUniversalTime().ToString("o"),
                    UpdatedAt = null
                };
                items.Add(record);
            }

            if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken))
                total = reader.GetInt32(0);

            return (items, total);
        }

        public async Task<DiagramRecord?> GetByIdForUserAsync(
            long id,
            string userId,
            CancellationToken cancellationToken)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(cancellationToken);

            // TODO: When per-user ownership exists, filter by userId column.
            var sql = @"SELECT id, name, definition, solution, created_at FROM diagrams WHERE id = @id LIMIT 1;";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.Add(new NpgsqlParameter("@id", NpgsqlTypes.NpgsqlDbType.Integer) { Value = (int)id });

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return new DiagramRecord
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                    Definition = reader.GetString(2),
                    Solution = reader.IsDBNull(3) ? null : reader.GetString(3),
                    CreatedAt = reader.GetFieldValue<DateTime>(4).ToUniversalTime().ToString("o"),
                    UpdatedAt = null
                };
            }

            return null;
        }

        public async Task<bool> UpdateSolutionAsync(
            long id,
            string solution,
            CancellationToken cancellationToken)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(cancellationToken);

            var sql = @"UPDATE diagrams SET solution = @solution WHERE id = @id;";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.Add(new NpgsqlParameter("@solution", NpgsqlTypes.NpgsqlDbType.Text) { Value = solution });
            cmd.Parameters.Add(new NpgsqlParameter("@id", NpgsqlTypes.NpgsqlDbType.Integer) { Value = (int)id });

            var affected = await cmd.ExecuteNonQueryAsync(cancellationToken);
            return affected > 0;
        }

        public async Task<DiagramRecord> CreateAsync(
            string userId,
            string name,
            string definition,
            CancellationToken cancellationToken)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(cancellationToken);

            var sql = @"
                INSERT INTO diagrams (name, definition, created_at)
                VALUES (@name, @definition, NOW())
                RETURNING id, name, definition, solution, created_at;";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.Add(new NpgsqlParameter("@name", NpgsqlTypes.NpgsqlDbType.Text) { Value = name });
            cmd.Parameters.Add(new NpgsqlParameter("@definition", NpgsqlTypes.NpgsqlDbType.Text) { Value = definition });

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return new DiagramRecord
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                    Definition = reader.GetString(2),
                    Solution = reader.IsDBNull(3) ? null : reader.GetString(3),
                    CreatedAt = reader.GetFieldValue<DateTime>(4).ToUniversalTime().ToString("o"),
                    UpdatedAt = null
                };
            }

            throw new InvalidOperationException("Failed to create diagram");
        }

        public async Task<bool> UpdateAsync(
            long id,
            string userId,
            string name,
            string definition,
            CancellationToken cancellationToken)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(cancellationToken);

            var sql = @"
                UPDATE diagrams 
                SET name = @name, definition = @definition, solution = NULL 
                WHERE id = @id;";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.Add(new NpgsqlParameter("@name", NpgsqlTypes.NpgsqlDbType.Text) { Value = name });
            cmd.Parameters.Add(new NpgsqlParameter("@definition", NpgsqlTypes.NpgsqlDbType.Text) { Value = definition });
            cmd.Parameters.Add(new NpgsqlParameter("@id", NpgsqlTypes.NpgsqlDbType.Integer) { Value = (int)id });

            var affected = await cmd.ExecuteNonQueryAsync(cancellationToken);
            return affected > 0;
        }

        public async Task<bool> DeleteAsync(
            long id,
            string userId,
            CancellationToken cancellationToken)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(cancellationToken);

            // TODO: When per-user ownership exists, filter by userId column.
            var sql = @"DELETE FROM diagrams WHERE id = @id;";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.Add(new NpgsqlParameter("@id", NpgsqlTypes.NpgsqlDbType.Integer) { Value = (int)id });

            var affected = await cmd.ExecuteNonQueryAsync(cancellationToken);
            return affected > 0;
        }
    }
}


