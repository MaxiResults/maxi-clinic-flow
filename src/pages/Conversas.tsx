import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

const mockConversas = [
  {
    id: 1,
    leadName: "Maria Silva",
    lastMessage: "Gostaria de agendar para amanhã",
    timestamp: "10:30",
    unread: 2,
  },
  {
    id: 2,
    leadName: "João Santos",
    lastMessage: "Qual o valor da massagem?",
    timestamp: "09:15",
    unread: 0,
  },
  {
    id: 3,
    leadName: "Ana Costa",
    lastMessage: "Obrigada pelo atendimento!",
    timestamp: "Ontem",
    unread: 0,
  },
];

const mockMessages = [
  {
    id: 1,
    sender: "lead",
    text: "Olá! Gostaria de saber mais sobre os tratamentos",
    timestamp: "10:25",
  },
  {
    id: 2,
    sender: "system",
    text: "Olá Maria! Temos diversos tratamentos disponíveis. Qual seria do seu interesse?",
    timestamp: "10:26",
  },
  {
    id: 3,
    sender: "lead",
    text: "Estou interessada em limpeza de pele",
    timestamp: "10:28",
  },
  {
    id: 4,
    sender: "system",
    text: "Ótimo! A limpeza de pele é um dos nossos tratamentos mais procurados. Gostaria de agendar uma avaliação?",
    timestamp: "10:29",
  },
  {
    id: 5,
    sender: "lead",
    text: "Gostaria de agendar para amanhã",
    timestamp: "10:30",
  },
];

export default function Conversas() {
  const [selectedConversa, setSelectedConversa] = useState(mockConversas[0]);
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Here you would send the message to the API
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  return (
    <DashboardLayout title="Conversas">
      <div className="grid h-[calc(100vh-160px)] grid-cols-3 gap-4">
        {/* Conversation List */}
        <Card className="col-span-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <h3 className="font-semibold">Conversas Ativas</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mockConversas.map((conversa) => (
                <div
                  key={conversa.id}
                  className={`cursor-pointer border-b p-4 transition-colors hover:bg-muted/50 ${
                    selectedConversa.id === conversa.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedConversa(conversa)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {conversa.leadName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{conversa.leadName}</p>
                        <span className="text-xs text-muted-foreground">
                          {conversa.timestamp}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {conversa.lastMessage}
                      </p>
                    </div>
                    {conversa.unread > 0 && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-status-new text-xs text-white">
                        {conversa.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Messages Area */}
        <Card className="col-span-2 overflow-hidden">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedConversa.leadName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversa.leadName}</h3>
                  <p className="text-sm text-muted-foreground">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "system" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender === "system"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`mt-1 text-xs ${
                        message.sender === "system"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
