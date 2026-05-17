import { useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const version = __APP_VERSION__;
const buildDate = __BUILD_DATE__;

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const currentEntry: ChangelogEntry = {
  version,
  date: buildDate,
  items: [
    "Upload de fotos e documentos via WhatsApp",
    "Emoji picker com busca e categorias",
    "Lightbox para visualização de imagens",
    "Avatar de contatos com fallback inteligente",
    "Indicador de digitação em tempo real",
    "Contador de caracteres nas mensagens",
    "Animações ao enviar mensagens",
  ],
};

const previousEntries: ChangelogEntry[] = [
  {
    version: "0.9.0",
    date: "2024-05-10",
    items: [
      "Sistema de conversas via WhatsApp",
      "Gravação de áudio",
      "Notificações sonoras",
      "Interface estilo WhatsApp Business",
    ],
  },
  {
    version: "0.8.0",
    date: "2024-05-01",
    items: ["Dashboard inicial", "Gestão de leads", "Autenticação"],
  },
];

export function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className="border-t bg-card px-4 py-2">
        <div className="flex items-center justify-center">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>v{version}</span>
                  <Info className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Build: {buildDate} • Clique para ver novidades
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <section className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-status-active text-white hover:bg-status-active">ATUAL</Badge>
                <h3 className="text-base font-semibold">v{currentEntry.version}</h3>
                <span className="text-xs text-muted-foreground">{currentEntry.date}</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {currentEntry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Versões Anteriores
              </h4>
              <div className="space-y-4">
                {previousEntries.map((entry) => (
                  <div key={entry.version} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="text-sm font-semibold">v{entry.version}</h5>
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {entry.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <span className="text-xs text-muted-foreground self-center">
              Última atualização: {buildDate}
            </span>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Footer;