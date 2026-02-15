import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Mail, Shield } from "lucide-react";

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrador",
  gestor: "Gestor",
  atendente: "Atendente",
  profissional: "Profissional",
  viewer: "Visualizador",
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const handleSaveProfile = async () => {
    if (!nome.trim() || !email.trim()) {
      toast({ title: "Erro", description: "Nome e email são obrigatórios", variant: "destructive" });
      return;
    }

    setSavingProfile(true);
    try {
      // TODO: await api.patch('/auth/profile', { nome, email });
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas (endpoint pendente)" });
      // await refreshUser();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error || "Erro ao salvar perfil",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!senhaAtual || !senhaNova || !senhaConfirm) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (senhaNova.length < 6) {
      toast({ title: "Erro", description: "A nova senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (senhaNova !== senhaConfirm) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      // TODO: await api.post('/auth/change-password', { senha_atual: senhaAtual, senha_nova: senhaNova });
      toast({ title: "Senha alterada", description: "Sua senha foi alterada com sucesso (endpoint pendente)" });
      setSenhaAtual("");
      setSenhaNova("");
      setSenhaConfirm("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error || "Erro ao alterar senha",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout title="Meu Perfil">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Avatar & Info */}
        <Card>
          <CardContent className="flex items-center gap-5 p-6">
            <Avatar className="h-20 w-20 text-2xl">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">{user?.nome}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-1">
                <Shield className="mr-1 h-3 w-3" />
                {roleLabels[user?.role || ""] || user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={savingProfile} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={savingProfile} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" /> Segurança
            </CardTitle>
            <CardDescription>Altere sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual">Senha Atual</Label>
              <Input id="senha-atual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} disabled={savingPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha-nova">Nova Senha</Label>
              <Input id="senha-nova" type="password" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} disabled={savingPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha-confirm">Confirmar Nova Senha</Label>
              <Input id="senha-confirm" type="password" value={senhaConfirm} onChange={(e) => setSenhaConfirm(e.target.value)} disabled={savingPassword} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={savingPassword}>
                {savingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
