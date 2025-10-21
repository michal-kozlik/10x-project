import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SolvedDiagramViewProps {
  solution: string;
}

export function SolvedDiagramView({ solution }: SolvedDiagramViewProps) {
  const grid = solution.split("").map((char, index) => ({
    value: char,
    row: Math.floor(index / 9),
    col: index % 9,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-9 gap-px bg-muted p-2 rounded-lg">
          {grid.map(({ value, row, col }, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-center
                h-8 w-8 sm:h-6 sm:w-6
                bg-background font-mono text-lg
                ${col % 3 === 2 && col !== 8 ? "border-r-2 border-r-muted" : ""}
                ${row % 3 === 2 && row !== 8 ? "border-b-2 border-b-muted" : ""}
              `}
            >
              {value}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
