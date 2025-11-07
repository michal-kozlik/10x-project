using FluentAssertions;
using Moq;
using SudokuApi.Repositories;
using SudokuApi.Services;
using Xunit;

namespace SudokuApi.Test;

public class DiagramServiceTests
{
    private readonly Mock<IDiagramRepository> _repositoryMock;
    private readonly Mock<ISudokuSolver> _solverMock;
    private readonly DiagramService _service;
    private readonly CancellationToken _cancellationToken;

    // Common test data
    private const string ValidUserId = "test-user";
    private const string ValidName = "Test Diagram";
    private const string ValidDefinition = "123456789123456789123456789123456789123456789123456789123456789123456789123456789";
    private static readonly DiagramRecord ValidDiagramRecord = new()
    {
        Id = 1,
        Name = ValidName,
        Definition = ValidDefinition,
        CreatedAt = "2025-11-01T12:00:00Z"
    };

    public DiagramServiceTests()
    {
        _repositoryMock = new Mock<IDiagramRepository>();
        _solverMock = new Mock<ISudokuSolver>();
        _service = new DiagramService(_repositoryMock.Object, _solverMock.Object);
        _cancellationToken = CancellationToken.None;
    }

    [Fact]
    public async Task CreateDiagramAsync_WithValidInput_ShouldReturnDiagram()
    {
        // Arrange
        _repositoryMock.Setup(r => r.CreateAsync(ValidUserId, ValidName, ValidDefinition, _cancellationToken))
                      .ReturnsAsync(ValidDiagramRecord);

        // Act
        var result = await _service.CreateDiagramAsync(ValidUserId, ValidName, ValidDefinition, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(ValidDiagramRecord);
        _repositoryMock.Verify(r => r.CreateAsync(ValidUserId, ValidName, ValidDefinition, _cancellationToken), Times.Once);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public async Task CreateDiagramAsync_WithInvalidDefinition_ShouldThrowValidationException(string definition)
    {
        // Act & Assert
        var act = () => _service.CreateDiagramAsync(ValidUserId, ValidName, definition, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ValidationException>()
                .WithMessage("definition must be provided");
    }

    [Fact]
    public async Task CreateDiagramAsync_WithTooLongDefinition_ShouldThrowValidationException()
    {
        // Arrange
        var longDefinition = new string('1', 10001);

        // Act & Assert
        var act = () => _service.CreateDiagramAsync(ValidUserId, ValidName, longDefinition, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ValidationException>()
                .WithMessage("definition length must be <= 10000 characters");
    }

    [Fact]
    public async Task CreateDiagramAsync_WithTooLongName_ShouldThrowValidationException()
    {
        // Arrange
        var longName = new string('a', 101);

        // Act & Assert
        var act = () => _service.CreateDiagramAsync(ValidUserId, longName, ValidDefinition, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ValidationException>()
                .WithMessage("name length must be <= 100 characters");
    }

    [Fact]
    public async Task CreateDiagramAsync_WhenRepositoryThrows_ShouldThrowValidationException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.CreateAsync(ValidUserId, ValidName, ValidDefinition, _cancellationToken))
                      .ThrowsAsync(new Exception("Database error"));

        // Act & Assert
        var act = () => _service.CreateDiagramAsync(ValidUserId, ValidName, ValidDefinition, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ValidationException>()
                .WithMessage("Failed to create diagram: Database error");
    }

    [Fact]
    public async Task UpdateDiagramAsync_WithValidInput_ShouldReturnUpdatedDiagram()
    {
        // Arrange
        var updatedDiagram = new DiagramRecord
        {
            Id = ValidDiagramRecord.Id,
            Name = ValidDiagramRecord.Name,
            Definition = ValidDiagramRecord.Definition,
            Solution = ValidDiagramRecord.Solution,
            CreatedAt = ValidDiagramRecord.CreatedAt,
            UpdatedAt = "2025-11-01T13:00:00Z"
        };

        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(ValidDiagramRecord);
        _repositoryMock.Setup(r => r.UpdateAsync(1, ValidUserId, ValidName, ValidDefinition, _cancellationToken))
                      .ReturnsAsync(true);
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(updatedDiagram);

        // Act
        var result = await _service.UpdateDiagramAsync(1, ValidUserId, ValidName, ValidDefinition, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(updatedDiagram);
        _repositoryMock.Verify(r => r.UpdateAsync(1, ValidUserId, ValidName, ValidDefinition, _cancellationToken), Times.Once);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task UpdateDiagramAsync_WithInvalidId_ShouldThrowValidationException(long id)
    {
        // Act & Assert
        var act = () => _service.UpdateDiagramAsync(id, ValidUserId, ValidName, ValidDefinition, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ValidationException>()
                .WithMessage("id must be a positive integer");
    }

    [Fact]
    public async Task UpdateDiagramAsync_WhenDiagramNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync((DiagramRecord?)null);

        // Act & Assert
        var act = () => _service.UpdateDiagramAsync(1, ValidUserId, ValidName, ValidDefinition, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.NotFoundException>()
                .WithMessage("Diagram not found");
    }

    [Fact]
    public async Task UpdateDiagramAsync_WhenUpdateFails_ShouldThrowConflictException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(ValidDiagramRecord);
        _repositoryMock.Setup(r => r.UpdateAsync(1, ValidUserId, ValidName, ValidDefinition, _cancellationToken))
                      .ReturnsAsync(false);

        // Act & Assert
        var act = () => _service.UpdateDiagramAsync(1, ValidUserId, ValidName, ValidDefinition, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ConflictException>()
                .WithMessage("Failed to update diagram");
    }

    [Fact]
    public void ValidateQuery_WithValidInput_ShouldReturnValidationResult()
    {
        // Arrange
        var page = 2;
        var limit = 20;
        var sortBy = "created_at";
        var filter = "test";

        // Act
        var result = _service.ValidateQuery(page, limit, sortBy, filter);

        // Assert
        result.Should().BeEquivalentTo(new DiagramService.QueryValidationResult
        {
            Page = page,
            Limit = limit,
            SortBy = sortBy,
            Filter = filter,
            Error = null
        });
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ValidateQuery_WithInvalidPage_ShouldReturnError(int page)
    {
        // Act
        var result = _service.ValidateQuery(page, 10, null, null);

        // Assert
        result.Error.Should().Be("page must be >= 1");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void ValidateQuery_WithInvalidLimit_ShouldReturnError(int limit)
    {
        // Act
        var result = _service.ValidateQuery(1, limit, null, null);

        // Assert
        result.Error.Should().Be("limit must be between 1 and 100");
    }

    [Theory]
    [InlineData("invalid")]
    [InlineData("date")]
    [InlineData("title")]
    public void ValidateQuery_WithInvalidSortBy_ShouldReturnError(string sortBy)
    {
        // Act
        var result = _service.ValidateQuery(1, 10, sortBy, null);

        // Assert
        result.Error.Should().Be("sortBy must be one of: created_at, name, id");
    }

    [Fact]
    public void ValidateQuery_WithTooLongFilter_ShouldReturnError()
    {
        // Arrange
        var filter = new string('a', 1001);

        // Act
        var result = _service.ValidateQuery(1, 10, null, filter);

        // Assert
        result.Error.Should().Be("filter length must be <= 1000");
    }

    [Fact]
    public async Task ListAsync_ShouldReturnDiagramsAndTotal()
    {
        // Arrange
        var expectedItems = new List<DiagramRecord> { ValidDiagramRecord };
        var expectedTotal = 1;
        _repositoryMock.Setup(r => r.ListAsync(ValidUserId, 1, 10, null, null, _cancellationToken))
                      .ReturnsAsync((expectedItems, expectedTotal));

        // Act
        var (items, total) = await _service.ListAsync(ValidUserId, 1, 10, null, null, _cancellationToken);

        // Assert
        items.Should().BeEquivalentTo(expectedItems);
        total.Should().Be(expectedTotal);
    }

    [Fact]
    public async Task GenerateAndSaveSolutionAsync_WithValidInput_ShouldReturnUpdatedDiagram()
    {
        // Arrange
        var solution = "987654321987654321987654321987654321987654321987654321987654321987654321987654321";
        var solvedDiagram = new DiagramRecord
        {
            Id = ValidDiagramRecord.Id,
            Name = ValidDiagramRecord.Name,
            Definition = ValidDiagramRecord.Definition,
            Solution = solution,
            CreatedAt = ValidDiagramRecord.CreatedAt
        };

        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(ValidDiagramRecord);
        _solverMock.Setup(s => s.Solve(ValidDefinition, _cancellationToken))
                   .Returns(solution);
        _repositoryMock.Setup(r => r.UpdateSolutionAsync(1, ValidUserId, solution, _cancellationToken))
                      .ReturnsAsync(true);
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(solvedDiagram);

        // Act
        var result = await _service.GenerateAndSaveSolutionAsync(1, ValidUserId, _cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(solvedDiagram);
        _solverMock.Verify(s => s.Solve(ValidDefinition, _cancellationToken), Times.Once);
        _repositoryMock.Verify(r => r.UpdateSolutionAsync(1, ValidUserId, solution, _cancellationToken), Times.Once);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task GenerateAndSaveSolutionAsync_WithInvalidId_ShouldThrowValidationException(long id)
    {
        // Act & Assert
        var act = () => _service.GenerateAndSaveSolutionAsync(id, ValidUserId, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ValidationException>()
                .WithMessage("id must be a positive integer");
    }

    [Fact]
    public async Task GenerateAndSaveSolutionAsync_WhenDiagramNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync((DiagramRecord?)null);

        // Act & Assert
        var act = () => _service.GenerateAndSaveSolutionAsync(1, ValidUserId, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.NotFoundException>()
                .WithMessage("Diagram not found");
    }

    [Fact]
    public async Task GenerateAndSaveSolutionAsync_WhenSolverThrowsUnsolvable_ShouldPropagateException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(ValidDiagramRecord);
        _solverMock.Setup(s => s.Solve(ValidDefinition, _cancellationToken))
                   .Throws(new DiagramService.UnsolvableException("Sudoku is unsolvable"));

        // Act & Assert
        var act = () => _service.GenerateAndSaveSolutionAsync(1, ValidUserId, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.UnsolvableException>();
    }

    [Fact]
    public async Task GenerateAndSaveSolutionAsync_WhenSolverThrowsOther_ShouldThrowValidationException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(ValidDiagramRecord);
        _solverMock.Setup(s => s.Solve(ValidDefinition, _cancellationToken))
                   .Throws(new Exception("Solver error"));

        // Act & Assert
        var act = () => _service.GenerateAndSaveSolutionAsync(1, ValidUserId, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ValidationException>()
                .WithMessage("solver failed: Solver error");
    }

    [Fact]
    public async Task DeleteDiagramAsync_WithValidInput_ShouldReturnTrue()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(ValidDiagramRecord);
        _repositoryMock.Setup(r => r.DeleteAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(true);

        // Act
        var result = await _service.DeleteDiagramAsync(1, ValidUserId, _cancellationToken);

        // Assert
        result.Should().BeTrue();
        _repositoryMock.Verify(r => r.DeleteAsync(1, ValidUserId, _cancellationToken), Times.Once);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task DeleteDiagramAsync_WithInvalidId_ShouldThrowValidationException(long id)
    {
        // Act & Assert
        var act = () => _service.DeleteDiagramAsync(id, ValidUserId, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ValidationException>()
                .WithMessage("id must be a positive integer");
    }

    [Fact]
    public async Task DeleteDiagramAsync_WhenDiagramNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync((DiagramRecord?)null);

        // Act & Assert
        var act = () => _service.DeleteDiagramAsync(1, ValidUserId, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.NotFoundException>()
                .WithMessage("Diagram not found");
    }

    [Fact]
    public async Task DeleteDiagramAsync_WhenDeleteFails_ShouldThrowConflictException()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdForUserAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(ValidDiagramRecord);
        _repositoryMock.Setup(r => r.DeleteAsync(1, ValidUserId, _cancellationToken))
                      .ReturnsAsync(false);

        // Act & Assert
        var act = () => _service.DeleteDiagramAsync(1, ValidUserId, _cancellationToken);
        await act.Should().ThrowAsync<DiagramService.ConflictException>()
                .WithMessage("Failed to delete diagram");
    }
}
