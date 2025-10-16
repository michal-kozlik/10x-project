using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace SudokuApi.Repositories
{
    public sealed class InMemoryDiagramRepository : IDiagramRepository
    {
        private readonly Dictionary<string, List<DiagramRecord>> _userIdToDiagrams = new();

        public Task<(IReadOnlyList<DiagramRecord> Items, int Total)> ListAsync(
            string userId,
            int page,
            int limit,
            string? sortBy,
            string? filter,
            CancellationToken cancellationToken)
        {
            if (!_userIdToDiagrams.TryGetValue(userId, out var list))
            {
                return Task.FromResult(((IReadOnlyList<DiagramRecord>)new List<DiagramRecord>(), 0));
            }

            IEnumerable<DiagramRecord> query = list;

            if (!string.IsNullOrWhiteSpace(filter))
            {
                var f = filter.Trim();
                query = query.Where(d => d.Name.Contains(f, System.StringComparison.OrdinalIgnoreCase));
            }

            query = sortBy switch
            {
                "name" => query.OrderBy(d => d.Name),
                "id" => query.OrderBy(d => d.Id),
                _ => query.OrderByDescending(d => d.CreatedAt)
            };

            var total = query.Count();
            var items = query.Skip((page - 1) * limit).Take(limit).ToList();

            return Task.FromResult(((IReadOnlyList<DiagramRecord>)items, total));
        }
    }
}


