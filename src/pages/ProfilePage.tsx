import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Lock, Shield, Loader2 } from "lucide-react";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrador",
  gestor: "Gestor",
  atendente: "Atendente",
  profissional: "Profissional",
  viewer: "Visualizador",
};

export default function ProfilePage() {
  const { user, refreshUser, isLoading } = useAuth();

  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = user?.nome
    ? user.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const handleSaveProfile = async () => {
    if (!nome.trim() || !email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { nome, email });
      await refreshUser();
      toast.success("Perfil atualizado com sucesso");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao atualizar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!senhaAtual || !senhaNova || !senhaConfirm) {
      toast.error("Preencha todos os campos de senha");
      return;
    }
    if (senhaNova.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (senhaNova !== senhaConfirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        senha_atual: senhaAtual,
        senha_nova: senhaNova,
      });
      toast.success("Senha alterada com sucesso");
      setSenhaAtual("");
      setSenhaNova("");
      setSenhaConfirm("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading || !user) {
    return (
      <DashboardLayout title="Meu Perfil">
        <ProfileSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Meu Perfil">
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        {/* Avatar & Info */}
        <Card>
          <CardContent className="flex items-center gap-5 p-6">
            <Avatar className="h-20 w-20 text-2xl">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
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
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {savingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
