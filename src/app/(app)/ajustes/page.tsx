import { ItemLink, ItemList } from "@/components/item-list";
import { PageHeader } from "@/components/page-header";

const SETTINGS = [
  { href: "/plan", title: "Plan mensual", subtitle: "Cómo se reparte todo entre las dos quincenas" },
  { href: "/cuentas", title: "Cuentas", subtitle: "Cuentas bancarias y tarjetas de crédito" },
  { href: "/ingresos", title: "Ingresos", subtitle: "Salario y otros ingresos fijos" },
  { href: "/gastos-fijos", title: "Gastos fijos", subtitle: "Pagos recurrentes por quincena" },
  { href: "/presupuestos", title: "Presupuestos", subtitle: "Topes para gasolina, citas, etc." },
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
