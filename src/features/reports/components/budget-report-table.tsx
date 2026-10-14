import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BudgetReportLine } from "../budget-report";

export function BudgetReportTable({ lines }: { lines: BudgetReportLine[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Presupuesto</TableHead>
            <TableHead className="text-right">Gastado</TableHead>
            <TableHead className="text-right">Tope</TableHead>
            <TableHead className="text-right">Excedido</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="select-text">
          {lines.map((line) => (
            <TableRow key={line.name}>
              <TableCell className="max-w-28 truncate font-medium md:max-w-48">{line.name}</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  line.spentCents > line.plannedCents && "text-destructive",
                )}
              >
                {formatMoney(line.spentCents)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {formatMoney(line.plannedCents)}
              </TableCell>
              <TableCell
                className={cn("text-right tabular-nums", line.exceededCount > 0 && "text-destructive")}
              >
                {line.exceededCount} de {line.periodCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
