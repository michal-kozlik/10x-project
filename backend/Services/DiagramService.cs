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

        private readonly IDiagramRepository _repository;

        public DiagramService(IDiagramRepository repository)
        {
            _repository = repository;
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
            {
                return new QueryValidationResult { Error = "page must be >= 1" };
            }

            if (normalizedLimit < 1 || normalizedLimit > MaxLimit)
            {
                return new QueryValidationResult { Error = $"limit must be between 1 and {MaxLimit}" };
            }

            string? normalizedSortBy = null;
            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                var s = sortBy.Trim().ToLowerInvariant();
                if (s is not ("created_at" or "name" or "id"))
                {
                    return new QueryValidationResult { Error = "sortBy must be one of: created_at, name, id" };
                }
                normalizedSortBy = s;
            }

            string? normalizedFilter = null;
            if (!string.IsNullOrEmpty(filter))
            {
                if (filter.Length > 1000)
                {
                    return new QueryValidationResult { Error = "filter length must be <= 1000" };
                }
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
    }
}


