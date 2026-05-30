import { ChevronDown, Briefcase, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { companyStore, useCompanies } from "./companyStore";
import { toast } from "sonner";

export function CompanySwitcher() {
  const { companies, active, loaded } = useCompanies();
  const navigate = useNavigate();

  if (!loaded || companies.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Briefcase className="h-3.5 w-3.5 text-foreground-muted" />
        <span className="max-w-[120px] truncate">{active?.name ?? "Select company"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-foreground-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onSelect={async () => {
              if (c.is_active) return;
              await companyStore.setActive(c.id);
              toast.success(`Switched to ${c.name}`);
            }}
          >
            <span className="flex-1 truncate">{c.name}</span>
            {c.is_active && <Check className="ml-2 h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: "/account" })}>
          Manage companies
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
