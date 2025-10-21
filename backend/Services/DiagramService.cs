using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SudokuApi.Repositories;

namespace SudokuApi.Services
{
    public sealed class DiagramService
    {
        private const int DefaultPage = 1;
        private const int DefaultLimit = 10;
        private const int MaxLimit = 100;
        private const int MaxDefinitionLength = 10000;
        private const int MaxNameLength = 100;

        private readonly IDiagramRepository _repository;
        private readonly ISudokuSolver _solver;

        public DiagramService(IDiagramRepository repository, ISudokuSolver solver)
        {
            _repository = repository;
            _solver = solver;
        }

        private void ValidateDiagramInput(string name, string definition)
        {
            if (string.IsNullOrWhiteSpace(definition))
                throw new ValidationException("definition must be provided");

            if (definition.Length > MaxDefinitionLength)
                throw new ValidationException($"definition length must be <= {MaxDefinitionLength} characters");

            if (name?.Length > MaxNameLength)
                throw new ValidationException($"name length must be <= {MaxNameLength} characters");
        }

        public async Task<DiagramRecord> CreateDiagramAsync(
            string userId,
            string name,
            string definition,
            CancellationToken cancellationToken)
        {
            ValidateDiagramInput(name, definition);

            try 
            {
                return await _repository.CreateAsync(userId, name, definition, cancellationToken);
            }
            catch (Exception ex)
            {
                throw new ValidationException($"Failed to create diagram: {ex.Message}");
            }
        }

        public async Task<DiagramRecord> UpdateDiagramAsync(
            long id,
            string userId,
            string name,
            string definition,
            CancellationToken cancellationToken)
        {
            if (id <= 0)
                throw new ValidationException("id must be a positive integer");

            ValidateDiagramInput(name, definition);

            var existing = await _repository.GetByIdForUserAsync(id, userId, cancellationToken);
            if (existing is null)
                throw new NotFoundException("Diagram not found");

            var updated = await _repository.UpdateAsync(id, userId, name, definition, cancellationToken);
            if (!updated)
                throw new ConflictException("Failed to update diagram");

            var refreshed = await _repository.GetByIdForUserAsync(id, userId, cancellationToken);
            if (refreshed is null)
            {
                // Should not happen if update succeeded
                throw new NotFoundException("Diagram not found after update");
            }

            return refreshed;
        }

        public sealed class QueryValidationResult
        {
            public int Page { get; init; }
            public int Limit { get; init; }
            public string? SortBy { get; init; }
            public string? Filter { get; init; }
            public string? Error { get; init; }
        }

        public QueryValidationResult ValidateQuery(int? page, int? limit, string? sortBy, string? filter)
        {
            var normalizedPage = page ?? DefaultPage;
            var normalizedLimit = limit ?? DefaultLimit;

            if (normalizedPage < 1)
                return new QueryValidationResult { Error = "page must be >= 1" };

            if (normalizedLimit < 1 || normalizedLimit > MaxLimit)
                return new QueryValidationResult { Error = $"limit must be between 1 and {MaxLimit}" };

            string? normalizedSortBy = null;
            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                var s = sortBy.Trim().ToLowerInvariant();
                if (s is not ("created_at" or "name" or "id"))
                    return new QueryValidationResult { Error = "sortBy must be one of: created_at, name, id" };
                normalizedSortBy = s;
            }

            string? normalizedFilter = null;
            if (!string.IsNullOrEmpty(filter))
            {
                if (filter.Length > 1000)
                    return new QueryValidationResult { Error = "filter length must be <= 1000" };
                normalizedFilter = filter;
            }

            return new QueryValidationResult
            {
                Page = normalizedPage,
                Limit = normalizedLimit,
                SortBy = normalizedSortBy,
                Filter = normalizedFilter
            };
        }

        public async Task<(IReadOnlyList<DiagramRecord> Items, int Total)> ListAsync(
            string userId,
            int page,
            int limit,
            string? sortBy,
            string? filter,
            CancellationToken cancellationToken)
        {
            return await _repository.ListAsync(userId, page, limit, sortBy, filter, cancellationToken);
        }

        public sealed class NotFoundException : System.Exception
        {
            public NotFoundException(string message) : base(message) { }
        }

        public sealed class ValidationException : System.Exception
        {
            public ValidationException(string message) : base(message) { }
        }

        public sealed class ConflictException : System.Exception
        {
            public ConflictException(string message) : base(message) { }
        }

        public sealed class UnsolvableException : System.Exception
        {
            public UnsolvableException(string message) : base(message) { }
        }

        public async Task<DiagramRecord> GenerateAndSaveSolutionAsync(
            long diagramId,
            string userId,
            CancellationToken cancellationToken)
        {
            if (diagramId <= 0)
                throw new ValidationException("id must be a positive integer");

            var existing = await _repository.GetByIdForUserAsync(diagramId, userId, cancellationToken);
            if (existing is null)
                throw new NotFoundException("Diagram not found");

            if (string.IsNullOrWhiteSpace(existing.Definition))
                throw new ValidationException("definition must be provided");

            if (existing.Definition.Length > 10000)
                throw new ValidationException("definition length must be <= 10000 characters");

            string solution;
            try
            {
                solution = _solver.Solve(existing.Definition, cancellationToken);
            }
            catch (UnsolvableException)
            {
                throw;
            }
            catch (System.OperationCanceledException)
            {
                throw;
            }
            catch (System.Exception ex)
            {
                throw new ValidationException($"solver failed: {ex.Message}");
            }

            var updated = await _repository.UpdateSolutionAsync(diagramId, solution, cancellationToken);
            if (!updated)
                throw new ConflictException("Failed to update solution");

            var refreshed = await _repository.GetByIdForUserAsync(diagramId, userId, cancellationToken);
            if (refreshed is null)
            {
                // Should not happen if update succeeded
                throw new NotFoundException("Diagram not found after update");
            }

            return refreshed;
        }
    }
}


