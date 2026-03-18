import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ImageIcon, Dices } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useGameChat, useCreateChatMessage } from "@/hooks/use-vtt-api";

interface ChatLogProps {
  gameId: number;
  lastWsMessage: any;
  sendMessage: (msg: any) => void;
  myCharacterName?: string;
}

export function ChatLog({ gameId, lastWsMessage, sendMessage, myCharacterName }: ChatLogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: initialMessages = [] } = useGameChat(gameId);
  const { mutate: createMessage, isPending } = useCreateChatMessage();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  // Populate initial state from DB
  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
      scrollToBottom();
    }
  }, [initialMessages]);

  // Handle incoming websocket messages
  useEffect(() => {
    if (lastWsMessage?.type === "chat") {
      setMessages(prev => [...prev, lastWsMessage.payload]);
      scrollToBottom();
    } else if (lastWsMessage?.type === "system") {
      setMessages(prev => [...prev, { id: Date.now(), type: 'system', content: lastWsMessage.content, createdAt: new Date() }]);
      scrollToBottom();
    }
  }, [lastWsMessage]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    // Detect image URL
    const isImage = input.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
    const msgType = isImage ? 'image' : 'text';
    const sender = myCharacterName || user?.firstName || "Unknown";

    createMessage({
      gameId,
      type: msgType,
      content: input,
      senderName: sender
    }, {
      onSuccess: (savedMsg) => {
        // Optimistically add to our UI
        setMessages(prev => [...prev, savedMsg]);
        scrollToBottom();
        // Broadcast to others
        sendMessage({ type: "chat", payload: savedMsg });
        setInput("");
      }
    });
  };

  return (
    <Card className="flex flex-col h-[500px] md:h-full border-border/40 bg-card/50">
      <div className="p-3 border-b border-border/40 flex items-center justify-between bg-primary/5">
        <h3 className="font-display text-primary flex items-center gap-2">
          <span>Campaign Chat</span>
        </h3>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg: any) => (
            <div key={msg.id} className={`flex flex-col ${msg.type === 'system' ? 'items-center mt-2' : ''}`}>
              
              {msg.type === 'system' && (
                <span className="text-xs text-muted-foreground italic bg-secondary/20 px-2 py-1 rounded-full">
                  {msg.content}
                </span>
              )}
              
              {msg.type !== 'system' && (
                <div className="bg-background border border-border/50 rounded-lg p-3 max-w-[95%] shadow-sm">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-primary">{msg.senderName}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                       {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {msg.type === 'text' && (
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                  
                  {msg.type === 'image' && (
                    <img src={msg.content} alt="Shared" className="max-w-full rounded-md max-h-48 object-contain mt-1" />
                  )}
                  
                  {msg.type === 'roll' && (
                    <div className="mt-1 bg-secondary/10 border border-primary/20 rounded p-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-primary mb-1">
                        <Dices className="w-4 h-4" /> {JSON.parse(msg.content).label}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        Rolled {JSON.parse(msg.content).poolSize} dice: 
                        <span className="text-foreground ml-1">[{JSON.parse(msg.content).results.join(", ")}]</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xl font-bold font-display">{JSON.parse(msg.content).successes}</span>
                        <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Successes</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-10 italic">
              The fire crackles. Wait for others to speak.
            </div>
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSend} className="p-3 border-t border-border/40 bg-background flex gap-2">
        <Input 
          className="flex-1 bg-secondary/10" 
          placeholder="Type a message or image URL..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isPending}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isPending}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}
