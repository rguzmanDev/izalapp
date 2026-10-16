import { ItemLink, ItemList } from "@/components/item-list";
import { PageHeader } from "@/components/page-header";

const SETTINGS = [
  { href: "/plan", title: "Plan mensual", subtitle: "Cómo se reparte todo entre el pago del 15 y el del 30" },
  { href: "/cuentas", title: "Cuentas", subtitle: "Cuentas bancarias y tarjetas de crédito" },
  { href: "/ingresos", title: "Ingresos", subtitle: "Ingresos fijos de tu plan mensual" },
  { href: "/gastos-fijos", title: "Gastos fijos", subtitle: "Pagos recurrentes entre el 15 y el 30" },
  { href: "/presupuestos", title: "Presupuestos", subtitle: "Topes para gastos variables" },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Los cambios aplican a partir de la próxima quincena que abras"
      />
      <ItemList>
        {SETTINGS.map((setting) => (
          <ItemLink key={setting.href} {...setting} selectable={false} />
        ))}
      </ItemList>
    </>
  );
}
