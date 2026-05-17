import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function EmpresaBadge() {
  const { user } = useAuth();
  if (!user?.empresa_nome) return null;

  const nome = user.empresa_nome;
  const nomeExibicao = nome.length > 24 ? nome.substring(0, 24) + "…" : nome;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="hidden sm:inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1.5 text-sm font-medium text-foreground select-none cursor-default"
            aria-label={`Empresa: ${nome}`}
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate max-w-[180px]">{nomeExibicao}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{nome}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex sm:hidden items-center justify-center rounded-full border bg-muted/60 h-8 w-8 cursor-default"
            aria-label={`Empresa: ${nome}`}
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{nome}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default EmpresaBadge;