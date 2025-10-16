using System;
using System.Linq;
using System.Text;
using System.Threading;

namespace SudokuApi.Services
{
    public interface ISudokuSolver
    {
        string Solve(string definition, CancellationToken cancellationToken);
    }

    public sealed class BasicSudokuSolver : ISudokuSolver
    {
        public string Solve(string definition, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(definition))
            {
                throw new DiagramService.ValidationException("definition must be provided");
            }

            cancellationToken.ThrowIfCancellationRequested();

            // Normalize input: keep digits and ' '
            var normalized = new string(definition.Where(ch => char.IsDigit(ch) || ch == ' ').ToArray());
            if (normalized.Length != 9*9)
            {
                throw new DiagramService.ValidationException("definition must contain exactly 81 cells (digits or ' ')");
            }

            var grid = new int[9, 9];
            for (int i = 0; i < 9*9; i++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                char ch = normalized[i];
                int r = i / 9;
                int c = i % 9;
                if (ch == ' ')
                {
                    grid[r, c] = 0;
                }
                else if (ch >= '1' && ch <= '9')
                {
                    int val = ch - '0';
                    grid[r, c] = val;
                }
                else
                {
                    throw new DiagramService.ValidationException("definition contains invalid characters");
                }
            }

            if (!IsValidInitialGrid(grid))
            {
                throw new DiagramService.ValidationException("definition violates Sudoku constraints");
            }

            if (!Backtrack(grid, 0, 0, cancellationToken))
            {
                throw new DiagramService.UnsolvableException("Sudoku is unsolvable");
            }

            var sb = new StringBuilder(9*9);
            for (int r = 0; r < 9; r++)
            {
                for (int c = 0; c < 9; c++)
                {
                    sb.Append((char)('0' + grid[r, c]));
                }
            }

            return sb.ToString();
        }

        private static bool IsValidInitialGrid(int[,] grid)
        {
            // Check duplicates in rows, cols, and 3x3 boxes for pre-filled cells
            for (int r = 0; r < 9; r++)
            {
                var seen = new bool[10];
                for (int c = 0; c < 9; c++)
                {
                    int v = grid[r, c];
                    if (v == 0) continue;
                    if (seen[v]) return false;
                    seen[v] = true;
                }
            }

            for (int c = 0; c < 9; c++)
            {
                var seen = new bool[10];
                for (int r = 0; r < 9; r++)
                {
                    int v = grid[r, c];
                    if (v == 0) continue;
                    if (seen[v]) return false;
                    seen[v] = true;
                }
            }

            for (int br = 0; br < 9; br += 3)
            {
                for (int bc = 0; bc < 9; bc += 3)
                {
                    var seen = new bool[10];
                    for (int r = 0; r < 3; r++)
                    {
                        for (int c = 0; c < 3; c++)
                        {
                            int v = grid[br + r, bc + c];
                            if (v == 0) continue;
                            if (seen[v]) return false;
                            seen[v] = true;
                        }
                    }
                }
            }

            return true;
        }

        private static bool Backtrack(int[,] grid, int row, int col, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            if (row == 9) return true; // solved
            if (col == 9) return Backtrack(grid, row + 1, 0, ct);
            if (grid[row, col] != 0) return Backtrack(grid, row, col + 1, ct);

            for (int val = 1; val <= 9; val++)
            {
                if (IsSafe(grid, row, col, val))
                {
                    grid[row, col] = val;
                    if (Backtrack(grid, row, col + 1, ct)) return true;
                    grid[row, col] = 0;
                }
            }

            return false;
        }

        private static bool IsSafe(int[,] grid, int row, int col, int val)
        {
            for (int c = 0; c < 9; c++) if (grid[row, c] == val) return false;
            for (int r = 0; r < 9; r++) if (grid[r, col] == val) return false;

            int br = (row / 3) * 3;
            int bc = (col / 3) * 3;
            for (int r = 0; r < 3; r++)
            {
                for (int c = 0; c < 3; c++)
                {
                    if (grid[br + r, bc + c] == val) return false;
                }
            }

            return true;
        }
    }
}


