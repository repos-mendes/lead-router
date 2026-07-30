import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ReactNode } from "react";

export function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    aguardando: { label: "Aguardando", cls: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
    distribuido: {
      label: "Aguardando ação",
      cls: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    },
    em_atendimento: { label: "Lead Aceito", cls: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
    contato_feito: {
      label: "Contato Feito",
      cls: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    numero_invalido: { label: "Número Inválido", cls: "bg-red-100 text-red-800 hover:bg-red-100" },
  };
  const s = map[status] ?? { label: status, cls: "" };
  return (
    <Badge variant="secondary" className={s.cls}>
      {s.label}
    </Badge>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
