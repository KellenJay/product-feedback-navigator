import { Download, FileText, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  onExportPdf: () => void;
  onExportCsv: () => void;
  label?: string;
}

export function ExportMenu({ onExportPdf, onExportCsv, label = "Export" }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-3.5 w-3.5" />
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onExportPdf} className="cursor-pointer">
          <FileText className="mr-2 h-3.5 w-3.5" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportCsv} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
