import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface MessageThreadProps {
  messages: Message[];
  onSendMessage?: (content: string) => void;
}

export function MessageThread({ messages, onSendMessage }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isOwn ? "flex-row-reverse" : ""}`}
            data-testid={`message-${message.id}`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={message.senderAvatar} />
              <AvatarFallback className="text-xs">
                {message.senderName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className={`flex flex-col max-w-[70%] ${message.isOwn ? "items-end" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">{message.senderName}</span>
                <span className="text-xs text-muted-foreground">
                  {format(message.timestamp, "h:mm a")}
                </span>
              </div>
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            data-testid="input-message"
          />
          <Button 
            onClick={handleSend} 
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
