import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Users, Star } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Especialidade {
  id: string;
  cliente_id: number;
  empresa_id: number;
  nome: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  slug: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const especialidadeSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  cor: z.string().optional(),
  slug: z.string().min(1, "Slug é obrigatório"),
  ordem: z.coerce.number().default(0),
});

const iconOptions = [
  { value: 'Sparkles', label: 'Sparkles ✨' },
  { value: 'Heart', label: 'Heart ❤️' },
  { value: 'Hand', label: 'Hand ✋' },
  { value: 'Droplet', label: 'Droplet 💧' },
  { value: 'Waves', label: 'Waves 🌊' },
  { value: 'Smile', label: 'Smile 😊' },
  { value: 'Scissors', label: 'Scissors ✂️' },
  { value: 'Activity', label: 'Activity 📊' },
  { value: 'Star', label: 'Star ⭐' },
  { value: 'Zap', label: 'Zap ⚡' },
  { value: 'Stethoscope', label: 'Stethoscope 🩺' },
  { value: 'Shield', label: 'Shield 🛡️' },
];

const colorOptions = [
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#10b981', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#6366f1', label: 'Índigo' },
];

const gerarSlug = (nome: string): string => {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
};

export default function Especialidades() {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Especialidade | null>(null);
  const [contadores, setContadores] = useState<Record<string, number>>({});

  const form = useForm<z.infer<typeof especialidadeSchema>>({
    resolver: zodResolver(especialidadeSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      icone: 'Star',
      cor: '#ec4899',
      slug: '',
      ordem: 0,
    },
  });

  // Auto-gerar slug ao digitar nome
  const watchNome = form.watch('nome');
  useEffect(() => {
    if (watchNome && !isEditOpen) {
      form.setValue('slug', gerarSlug(watchNome));
    }
  }, [watchNome, isEditOpen]);

  // Buscar especialidades
  const fetchEspecialidades = async () => {
    try {
      setLoading(true);
      const response = await api.get('/especialidades');
      const data = response.data || [];
      setEspecialidades(data);
      
      // Buscar contadores
      const counts: Record<string, number> = {};
      for (const esp of data) {
        try {
          const countRes = await api.get(`/especialidades/${esp.id}/profissionais/count`);
          counts[esp.id] = countRes.data.count || 0;
        } catch (error) {
          counts[esp.id] = 0;
        }
      }
      setContadores(counts);
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as especialidades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  // Criar especialidade
  const handleCreate = async (data: z.infer<typeof especialidadeSchema>) => {
    try {
      await api.post('/especialidades', {
        nome: data.nome,
        descricao: data.descricao || '',
        icone: data.icone || 'Star',
        cor: data.cor || '#ec4899',
        slug: data.slug,
        ordem: data.ordem || 0,
      });
      toast({
        title: "✅ Especialidade criada!",
        description: "A especialidade foi criada com sucesso.",
      });
      setIsNewOpen(false);
      form.reset();
      fetchEspecialidades();
    } catch (error) {
      toast({
        title: "❌ Erro ao criar",
        description: "Não foi possível criar a especialidade.",
        variant: "destructive",
      });
    }
  };

  // Editar especialidade
  const handleUpdate = async (data: z.infer<typeof especialidadeSchema>) => {
    if (!selected) return;

    try {
      await api.patch(`/especialidades/${selected.id}`, data);
      toast({
        title: "✅ Especialidade atualizada!",
        description: "A especialidade foi atualizada com sucesso.",
      });
      setIsEditOpen(false);
      setSelected(null);
      form.reset();
      fetchEspecialidades();
    } catch (error) {
      toast({
        title: "❌ Erro ao atualizar",
        description: "Não foi possível atualizar a especialidade.",
        variant: "destructive",
      });
    }
  };

  // Excluir especialidade
  const handleDelete = async () => {
    if (!selected) return;

    const count = contadores[selected.id] || 0;
    if (count > 0) {
      toast({
        title: "⚠️ Não é possível excluir",
        description: `Esta especialidade possui ${count} profissional(is) vinculado(s).`,
        variant: "destructive",
      });
      setIsDeleteOpen(false);
      return;
    }

    try {
      await api.delete(`/especialidades/${selected.id}`);
      toast({
        title: "✅ Especialidade excluída!",
        description: "A especialidade foi excluída com sucesso.",
      });
      setIsDeleteOpen(false);
      setSelected(null);
      fetchEspecialidades();
    } catch (error) {
      toast({
        title: "❌ Erro ao excluir",
        description: "Não foi possível excluir a especialidade.",
        variant: "destructive",
      });
    }
  };

  // Abrir modal de edição
  const openEdit = (especialidade: Especialidade) => {
    setSelected(especialidade);
    form.reset({
      nome: especialidade.nome,
      descricao: especialidade.descricao || '',
      icone: especialidade.icone || 'Star',
      cor: especialidade.cor || '#ec4899',
      slug: especialidade.slug,
      ordem: especialidade.ordem,
    });
    setIsEditOpen(true);
  };

  return (
    <DashboardLayout title="Especialidades">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">⭐ Especialidades</h1>
            <p className="text-muted-foreground mt-2">
              Defina as especialidades que seus profissionais podem atender
            </p>
          </div>
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Especialidade
          </Button>
        </div>

        {/* Lista de especialidades */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : especialidades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Nenhuma especialidade cadastrada</p>
                <p className="text-sm text-muted-foreground">
                  Comece criando sua primeira especialidade
                </p>
                <Button onClick={() => setIsNewOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira especialidade
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {especialidades.map((especialidade) => {
              const Icon = especialidade.icone 
                ? (Icons as any)[especialidade.icone] 
                : Star;
              const count = contadores[especialidade.id] || 0;

              return (
                <Card 
                  key={especialidade.id} 
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ 
                          backgroundColor: `${especialidade.cor}20`,
                        }}
                      >
                        <Icon 
                          className="h-6 w-6" 
                          style={{ color: especialidade.cor }}
                        />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{especialidade.nome}</CardTitle>
                    {especialidade.descricao && (
                      <CardDescription className="mt-2">
                        {especialidade.descricao}
                      </CardDescription>
                    )}
                    {count > 0 && (
                      <Badge variant="secondary" className="mt-2 w-fit">
                        <Users className="h-3 w-3 mr-1" />
                        {count} {count === 1 ? 'profissional' : 'profissionais'}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(especialidade)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelected(especialidade);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Nova Especialidade */}
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Especialidade</DialogTitle>
              <DialogDescription>
                Crie uma nova especialidade para seus profissionais
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Estética Facial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva esta especialidade..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ícone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um ícone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            {iconOptions.map((option) => {
                              const IconComponent = (Icons as any)[option.value];
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma cor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            {colorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="h-4 w-4 rounded-full border"
                                    style={{ backgroundColor: option.value }}
                                  />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="estetica-facial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsNewOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Especialidade</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal: Editar Especialidade */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Especialidade</DialogTitle>
              <DialogDescription>
                Atualize as informações da especialidade
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Estética Facial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva esta especialidade..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ícone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um ícone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            {iconOptions.map((option) => {
                              const IconComponent = (Icons as any)[option.value];
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma cor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            {colorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="h-4 w-4 rounded-full border"
                                    style={{ backgroundColor: option.value }}
                                  />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="estetica-facial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Atualizar Especialidade</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal: Excluir Especialidade */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a especialidade "{selected?.nome}"?
                {contadores[selected?.id || ''] > 0 && (
                  <span className="block mt-2 text-destructive font-medium">
                    ⚠️ Esta especialidade possui {contadores[selected?.id || '']} profissional(is) vinculado(s) e não pode ser excluída.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
