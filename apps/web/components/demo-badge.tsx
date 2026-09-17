import { FlaskConical } from "lucide-react";
import { Badge } from "./ui/badge";

export function DemoDataBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <Badge variant="warning" className="gap-1">
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}
