import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  senha: z.string().min(6, "Mínimo 6 caracteres").max(72),
  role: z.enum(["admin", "manager", "atendente"]),
});

type FormData = z.infer<typeof schema>;

interface DarAcessoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profissional: {
    id: string;
    nome: string;
    email?: string;
  } | null;
  onSuccess: () => void;
}

export function DarAcessoModal({
  open,
  onOpenChange,
  profissional,
  onSuccess,
}: DarAcessoModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: profissional?.email ?? "",
      senha: "",
      role: "atendente",
    },
  });

  useEffect(() => {
    if (open && profissional) {
      reset({
        email: profissional.email ?? "",
        senha: "",
        role: "atendente",
      });
    }
  }, [open, profissional, reset]);

  const role = watch("role");

  const onSubmit = async (data: FormData) => {
    if (!profissional) return;
    setSubmitting(true);
    try {
      await api.post("/usuarios", {
        nome: profissional.nome,
        email: data.email,
        senha: data.senha,
        role: data.role,
        profissional_id: profissional.id,
      });
      toast({ title: "Acesso criado com sucesso" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const status = error?.response?.status;
      toast({
        title: "Erro",
        description:
          status === 409
            ? "Este email já está cadastrado no sistema"
            : "Erro ao criar acesso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dar acesso ao sistema</DialogTitle>
          <DialogDescription>
            Crie um login para que este profissional possa acessar o sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Profissional</Label>
            <Input value={profissional?.nome ?? ""} disabled readOnly />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email de acesso *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@dominio.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="senha">Senha temporária *</Label>
            <Input id="senha" type="password" {...register("senha")} />
            {errors.senha ? (
              <p className="text-xs text-destructive">{errors.senha.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                ℹ️ Mínimo 6 caracteres. O profissional deverá alterar no
                primeiro acesso.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Perfil de acesso *</Label>
            <Select
              value={role}
              onValueChange={(v) =>
                setValue("role", v as FormData["role"], { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atendente">Atendente</SelectItem>
                <SelectItem value="manager">Gestor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar acesso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}