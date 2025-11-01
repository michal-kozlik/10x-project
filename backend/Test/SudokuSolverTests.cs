using FluentAssertions;
using SudokuApi.Services;
using Xunit;

namespace SudokuApi.Test;

public class SudokuSolverTests
{
    private readonly ISudokuSolver _solver;
    private readonly CancellationToken _cancellationToken;

    public SudokuSolverTests()
    {
        _solver = new BasicSudokuSolver();
        _cancellationToken = CancellationToken.None;
    }

    [Fact]
    public void Solve_WithValidInput_ShouldReturnSolution()
    {
        // Arrange
        var input = string.Join("", new[]
        {
            "53  7    ",
            "6  195   ",
            " 98    6 ",
            "8   6   3",
            "4  8 3  1",
            "7   2   6",
            " 6    28 ",
            "   419  5",
            "    8  79"
        });

        var expected = string.Join("", new[]
        {
            "534678912",
            "672195348",
            "198342567",
            "859761423",
            "426853791",
            "713924856",
            "961537284",
            "287419635",
            "345286179"
        });

        // Act
        var result = _solver.Solve(input, _cancellationToken);

        // Assert
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("                                                                                 ")] // 81 spaces
    public void Solve_WithNullOrEmptyInput_ShouldThrowValidationException(string input)
    {
        // Act & Assert
        var act = () => _solver.Solve(input, _cancellationToken);
        act.Should().Throw<DiagramService.ValidationException>()
           .WithMessage("definition must be provided");
    }

    [Fact]
    public void Solve_WithInvalidLength_ShouldThrowValidationException()
    {
        // Arrange
        var input = "123456";

        // Act & Assert
        var act = () => _solver.Solve(input, _cancellationToken);
        act.Should().Throw<DiagramService.ValidationException>()
           .WithMessage("definition must contain exactly 81 cells (digits or ' ')");
    }

    [Fact]
    public void Solve_WithInvalidCharacters_ShouldThrowValidationException()
    {
        // Arrange
        var input = new string('.', 81);

        // Act & Assert
        var act = () => _solver.Solve(input, _cancellationToken);
        act.Should().Throw<DiagramService.ValidationException>()
           .WithMessage("definition must contain exactly 81 cells (digits or ' ')");
    }

    [Fact]
    public void Solve_WithDuplicateInRow_ShouldThrowValidationException()
    {
        // Arrange
        var input = string.Join("", new[]
        {
            "11       ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         "
        });

        // Act & Assert
        var act = () => _solver.Solve(input, _cancellationToken);
        act.Should().Throw<DiagramService.ValidationException>()
           .WithMessage("definition violates Sudoku constraints");
    }

    [Fact]
    public void Solve_WithDuplicateInColumn_ShouldThrowValidationException()
    {
        // Arrange
        var input = string.Join("", new[]
        {
            "1        ",
            "1        ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         "
        });

        // Act & Assert
        var act = () => _solver.Solve(input, _cancellationToken);
        act.Should().Throw<DiagramService.ValidationException>()
           .WithMessage("definition violates Sudoku constraints");
    }

    [Fact]
    public void Solve_WithDuplicateInBox_ShouldThrowValidationException()
    {
        // Arrange
        var input = string.Join("", new[]
        {
            "1        ",
            " 1       ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         ",
            "         "
        });

        // Act & Assert
        var act = () => _solver.Solve(input, _cancellationToken);
        act.Should().Throw<DiagramService.ValidationException>()
           .WithMessage("definition violates Sudoku constraints");
    }

    [Theory]
    [MemberData(nameof(UnsolvableGridData1))]
    [MemberData(nameof(UnsolvableGridData2))]
    public void Solve_WithUnsolvablePuzzle_ShouldThrowUnsolvableException(string[] arrInput)
    {
        // Arrange
        var input = string.Join("", arrInput);

        // Act & Assert
        var act = () => _solver.Solve(input, _cancellationToken);
        act.Should().Throw<DiagramService.UnsolvableException>()
           .WithMessage("Sudoku is unsolvable");
    }

    [Fact]
    public void Solve_WithCancellation_ShouldThrowOperationCanceledException()
    {
        // Arrange
        var input = string.Join("", new[]
{
            "53  7    ",
            "6  195   ",
            " 98    6 ",
            "8   6   3",
            "4  8 3  1",
            "7   2   6",
            " 6    28 ",
            "   419  5",
            "    8  79"
        });
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act & Assert
        var act = () => _solver.Solve(input, cts.Token);
        act.Should().Throw<OperationCanceledException>();
    }

    [Theory]
    [MemberData(nameof(SparseGridData1))]
    [MemberData(nameof(SparseGridData2))]
    public void Solve_WithScarseGrid_ShouldReturnValidSolution(string[] arrInput)
    {
        // Arrange
        var input = string.Join("", arrInput);

        // Act
        var result = _solver.Solve(input, _cancellationToken);

        // Assert
        result.Should().HaveLength(81);
        result.Should().MatchRegex("^[1-9]{81}$");
        ValidateSudokuSolution(result);
    }

    private static void ValidateSudokuSolution(string solution)
    {
        // Check rows
        for (int row = 0; row < 9; row++)
        {
            var rowDigits = solution.Substring(row * 9, 9);
            rowDigits.Distinct().Count().Should().Be(9, $"Row {row} contains duplicates");
        }

        // Check columns
        for (int col = 0; col < 9; col++)
        {
            var colDigits = string.Concat(Enumerable.Range(0, 9).Select(row => solution[row * 9 + col]));
            colDigits.Distinct().Count().Should().Be(9, $"Column {col} contains duplicates");
        }

        // Check 3x3 boxes
        for (int boxRow = 0; boxRow < 3; boxRow++)
        {
            for (int boxCol = 0; boxCol < 3; boxCol++)
            {
                var boxDigits = string.Concat(
                    Enumerable.Range(0, 3).SelectMany(row =>
                        Enumerable.Range(0, 3).Select(col =>
                            solution[(boxRow * 3 + row) * 9 + boxCol * 3 + col])));
                boxDigits.Distinct().Count().Should().Be(9, $"Box at {boxRow},{boxCol} contains duplicates");
            }
        }
    }

    public static IEnumerable<object[]> SparseGridData1()
    {
        yield return new object[]
        {
            new[]
            {
                "1        ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         "
            }
        };
    }

    public static IEnumerable<object[]> SparseGridData2()
    {
        yield return new object[]
        {
            new[]
            {
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "        9"
            }
        };
    }

    public static IEnumerable<object[]> UnsolvableGridData1()
    {
        yield return new object[]
        {
            new[]
            {
                "12345678 ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "         ",
                "        9"            
            }
        };
    }

    public static IEnumerable<object[]> UnsolvableGridData2()
    {
        yield return new object[]
        {
            new[]
            {
                "5 3  7   ",
                "6  195   ",
                " 98    6 ",
                "8   6   3",
                "4  8 3  1",
                "7   2   6",
                " 6    28 ",
                "   419  5",
                "    8  7 "
            }
        };
    }
}

