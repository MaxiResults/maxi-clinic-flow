import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  BookOpen,
  FileSpreadsheet,
  FileCode,
  Eye,
  Download,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

export default function KnowledgeBase() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docViewer, setDocViewer] = useState<{
    id: string;
    url: string | null;
    filename: string;
    fileType: string;
    textContent?: string;
  } | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['knowledge-documents'],
    queryFn: async () => {
      const res = await api.get('/knowledge/documents');
      return res.data as any[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: async () => {
      const res = await api.get('/knowledge/stats');
      return res.data as { totalDocuments?: number; totalChunks?: number; totalChars?: number };
    },
  });

  const handleUpload = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded * 100) / (e.total || 1)));
        },
      });
      toast({ title: '✅ Documento processado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao fazer upload';
      setUploadError(msg);
      toast({ title: 'Erro no upload', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/knowledge/documents/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Documento removido' });
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] });
    },
    onError: () => {
      toast({ title: 'Erro ao remover documento', variant: 'destructive' });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type?.includes('word') || type?.includes('docx')) return <FileSpreadsheet className="h-5 w-5 text-blue-500" />;
    return <FileCode className="h-5 w-5 text-gray-500" />;
  };

  const handleViewDocument = async (doc: any) => {
    if (doc.file_url) {
      setDocViewer({
        id: doc.id,
        url: doc.file_url,
        filename: doc.original_name || doc.filename,
        fileType: doc.file_type || '',
        textContent: doc.text_content,
      });
      return;
    }

    try {
      const res = await api.get(`/knowledge/documents/${doc.id}/view-url`);
      setDocViewer({
        id: doc.id,
        url: res.data?.data?.url || null,
        filename: doc.original_name || doc.filename,
        fileType: doc.file_type || '',
        textContent: doc.text_content,
      });
    } catch {
      setDocViewer({
        id: doc.id,
        url: null,
        filename: doc.original_name || doc.filename,
        fileType: doc.file_type || '',
        textContent: doc.text_content,
      });
    }
  };

  return (
    <DashboardLayout title="Knowledge Base">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-emerald-500" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-2">
            Documentos que o assistente IA usa para responder perguntas
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.totalDocuments ?? 0}</div>
                <div className="text-xs text-muted-foreground">Documentos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <FileCode className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.totalChunks ?? 0}</div>
                <div className="text-xs text-muted-foreground">Chunks processados</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stats?.totalChars ? (stats.totalChars / 1000).toFixed(1) + 'K' : '0'}
                </div>
                <div className="text-xs text-muted-foreground">Caracteres indexados</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dropzone */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Documento</CardTitle>
            <CardDescription>PDF, DOCX ou TXT — máximo 10MB</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />

              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500" />
                  <p className="text-sm font-medium">Processando documento...</p>
                  <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                </div>
              ) : isDragActive ? (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-emerald-500" />
                  <p className="text-sm font-medium">Solte o arquivo aqui!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Arraste um arquivo ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, TXT — máx. 10MB
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {uploadError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de documentos */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos ({documents?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))}
              </div>
            ) : !documents?.length ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum documento ainda.</p>
                <p className="text-sm text-muted-foreground/70">
                  Faça upload acima para treinar a IA
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-md bg-muted">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.original_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{doc.total_chunks} chunks</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Indexado
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-primary"
                      onClick={() => handleViewDocument(doc)}
                      title="Visualizar documento"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Remover "${doc.original_name}"?`)) {
                          deleteMutation.mutate(doc.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      title="Remover documento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visualizador de documentos */}
        {docViewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] mx-4 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(docViewer.fileType)}
                  <span className="text-sm font-medium truncate">{docViewer.filename}</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {docViewer.url && (
                    <a
                      href={docViewer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={docViewer.filename}
                      className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors"
                      title="Baixar arquivo"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => setDocViewer(null)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-auto p-1">
                {(() => {
                  const type = docViewer.fileType?.toLowerCase() || '';
                  const isImage = type.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(docViewer.filename);
                  const isPDF = type.includes('pdf') || docViewer.filename.toLowerCase().endsWith('.pdf');
                  const isText = type.includes('text') || docViewer.filename.toLowerCase().endsWith('.txt');

                  // PDF
                  if (isPDF && docViewer.url) {
                    return (
                      <iframe
                        src={docViewer.url}
                        className="w-full h-full rounded"
                        title={docViewer.filename}
                      />
                    );
                  }

                  // Imagem
                  if (isImage && docViewer.url) {
                    return (
                      <div className="flex items-center justify-center h-full p-4">
                        <img
                          src={docViewer.url}
                          alt={docViewer.filename}
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      </div>
                    );
                  }

                  // Texto extraído (Word, txt, ou fallback)
                  if (docViewer.textContent) {
                    return (
                      <div className="p-4 h-full overflow-auto">
                        <div className="bg-muted/30 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                          {docViewer.textContent}
                        </div>
                      </div>
                    );
                  }

                  // Sem preview disponível — oferecer download
                  return (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                      <FileText className="h-16 w-16 opacity-30" />
                      <p className="text-sm">Visualização não disponível para este tipo de arquivo.</p>
                      {docViewer.url && (
                        <a
                          href={docViewer.url}
                          download={docViewer.filename}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Baixar arquivo
                        </a>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
