import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { totalOf, type Halves } from "@/lib/allocation";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { MonthlyPlan, PlanSection } from "../build-plan";

function AmountCells({ halves, className }: { halves: Halves; className?: string }) {
  return (
    <>
      {[halves.first, halves.second, totalOf(halves)].map((cents, index) => (
        <TableCell
          key={index}
          className={cn("text-right tabular-nums", cents < 0 && "text-destructive", className)}
        >
          {formatMoney(cents)}
        </TableCell>
      ))}
    </>
  );
}

function SectionRows({ title, section }: { title: string; section: PlanSection }) {
  return (
    <>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell className="font-medium">{title}</TableCell>
        <AmountCells halves={section.total} className="font-medium" />
      </TableRow>
      {section.lines.map((line) => (
        <TableRow key={line.id}>
          <TableCell className="max-w-28 truncate pl-4 md:max-w-40 text-muted-foreground">{line.name}</TableCell>
          <AmountCells halves={line.halves} className="text-muted-foreground" />
        </TableRow>
      ))}
    </>
  );
}

export function PlanTable({ plan }: { plan: MonthlyPlan }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead className="text-right">
              Pago<span className="hidden md:inline"> del</span> 15
            </TableHead>
            <TableHead className="text-right">
              Pago<span className="hidden md:inline"> del</span> 30
            </TableHead>
            <TableHead className="text-right">Mes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="select-text">
          <SectionRows title="Ingresos" section={plan.incomes} />
          <SectionRows title="Gastos fijos" section={plan.fixedExpenses} />
          <SectionRows title="Presupuestos" section={plan.budgets} />
        </TableBody>
        <TableFooter className="select-text">
          <TableRow>
            <TableCell className="font-semibold">Sobrante</TableCell>
            <AmountCells halves={plan.surplus} className="font-semibold" />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
