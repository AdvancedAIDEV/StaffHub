import { MessageThread } from "@/components/message-thread";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, Search, MessageSquare } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useLocation } from "wouter";

interface ConversationData {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: { content: string; createdAt: string };
  unreadCount: number;
}

interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
}

function formatConvTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function getUserName(u: UserData): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Unknown";
}

function getUserInitials(u?: UserData | null): string {
  if (!u) return "?";
  const first = u.firstName?.[0] || "";
  const last = u.lastName?.[0] || "";
  if (first || last) return (first + last).toUpperCase();
  return (u.email?.[0] || "U").toUpperCase();
}

export default function Messages() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [newConvDialogOpen, setNewConvDialogOpen] = useState(false);
  const [newConvUserId, setNewConvUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const to = params.get("to");
    if (to) {
      setSelectedPartnerId(to);
    }
  }, [location]);

  const { data: conversations = [], isLoading: convsLoading } = useQuery<ConversationData[]>({
    queryKey: ["/api/messages/conversations"],
  });

  const { data: allUsers = [] } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
  });

  const { data: messagesData = [], isLoading: msgsLoading } = useQuery<any[]>({
    queryKey: ["/api/messages", selectedPartnerId],
    enabled: !!selectedPartnerId,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", "/api/messages", { recipientId: selectedPartnerId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedPartnerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  if (convsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.partnerId === selectedPartnerId);
  const selectedPartner = allUsers.find(u => u.id === selectedPartnerId);
  const partnerName = selectedConv?.partnerName || (selectedPartner ? getUserName(selectedPartner) : selectedPartnerId || "");
  const partnerAvatar = selectedConv?.partnerAvatar || selectedPartner?.profileImageUrl || "";

  const mappedMessages = messagesData.map((msg: any) => {
    const sender = allUsers.find(u => u.id === msg.senderId);
    return {
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderId === user?.id ? "You" : (sender ? getUserName(sender) : partnerName),
      senderAvatar: msg.senderId === user?.id ? user?.profileImageUrl || "" : (sender?.profileImageUrl || partnerAvatar),
      content: msg.content,
      timestamp: new Date(msg.createdAt),
      isOwn: msg.senderId === user?.id,
    };
  });

  const filteredConversations = searchTerm
    ? conversations.filter(c =>
        c.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  const existingPartnerIds = new Set(conversations.map(c => c.partnerId));
  const availableNewUsers = allUsers.filter(u => u.id !== user?.id && !existingPartnerIds.has(u.id));

  const startNewConversation = () => {
    if (newConvUserId) {
      setSelectedPartnerId(newConvUserId);
      setNewConvDialogOpen(false);
      setNewConvUserId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Messages</h1>
          <p className="text-muted-foreground mt-1">Communicate with your team</p>
        </div>
        <Dialog open={newConvDialogOpen} onOpenChange={setNewConvDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-conversation">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Select a person</label>
                <Select onValueChange={setNewConvUserId} value={newConvUserId}>
                  <SelectTrigger data-testid="select-new-conv-user">
                    <SelectValue placeholder="Choose a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNewUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {getUserName(u)}
                      </SelectItem>
                    ))}
                    {availableNewUsers.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No new users to message
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={startNewConversation} disabled={!newConvUserId} data-testid="button-start-conversation">
                Start Conversation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        <Card className="overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-conversations"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4 gap-2">
                <MessageSquare className="h-8 w-8" />
                <p>{searchTerm ? "No matching conversations" : "No conversations yet"}</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  onClick={() => setSelectedPartnerId(conv.partnerId)}
                  className={`p-3 border-b border-border cursor-pointer hover-elevate ${
                    selectedPartnerId === conv.partnerId ? "bg-muted" : ""
                  }`}
                  data-testid={`conversation-${conv.partnerId}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.partnerAvatar || ""} />
                      <AvatarFallback className="text-xs">
                        {conv.partnerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm truncate" data-testid={`text-partner-name-${conv.partnerId}`}>{conv.partnerName}</h4>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {conv.lastMessage?.createdAt ? formatConvTime(conv.lastMessage.createdAt) : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage?.content || ""}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 min-w-[18px] flex items-center justify-center">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          {selectedPartnerId ? (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-border">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={partnerAvatar} />
                  <AvatarFallback className="text-xs">
                    {partnerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-medium text-sm" data-testid="text-active-partner">{partnerName}</h3>
              </div>
              {msgsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <MessageThread
                  messages={mappedMessages}
                  onSendMessage={(content) => sendMutation.mutate(content)}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <MessageSquare className="h-10 w-10" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
