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

        Task<DiagramRecord?> GetByIdForUserAsync(
            long id,
            string userId,
            CancellationToken cancellationToken);

        Task<bool> UpdateSolutionAsync(
            long id,
            string solution,
            CancellationToken cancellationToken);
            
        Task<DiagramRecord> CreateAsync(
            string userId,
            string name,
            string definition,
            CancellationToken cancellationToken);
            
        Task<bool> UpdateAsync(
            long id,
            string userId,
            string name,
            string definition,
            CancellationToken cancellationToken);

        Task<bool> DeleteAsync(
            long id,
            string userId,
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


