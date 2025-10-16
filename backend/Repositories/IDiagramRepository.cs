using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace SudokuApi.Repositories
{
    public interface IDiagramRepository
    {
        Task<(IReadOnlyList<DiagramRecord> Items, int Total)> ListAsync(
            string userId,
            int page,
            int limit,
            string? sortBy,
            string? filter,
            CancellationToken cancellationToken);
    }

    public sealed class DiagramRecord
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Definition { get; set; } = string.Empty;
        public string? Solution { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string? UpdatedAt { get; set; }
    }
}


