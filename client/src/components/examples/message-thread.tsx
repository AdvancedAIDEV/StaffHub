import { MessageThread } from "../message-thread";

export default function MessageThreadExample() {
  const messages = [
    {
      id: "1",
      senderId: "admin1",
      senderName: "Admin",
      content: "Hi John, are you available for the gala event next Friday?",
      timestamp: new Date(2025, 9, 15, 10, 30),
      isOwn: false,
    },
    {
      id: "2",
      senderId: "staff1",
      senderName: "John Doe",
      content: "Yes, I'm available! What time do you need me?",
      timestamp: new Date(2025, 9, 15, 10, 35),
      isOwn: true,
    },
    {
      id: "3",
      senderId: "admin1",
      senderName: "Admin",
      content: "Great! The event starts at 6 PM. Please arrive by 5:30 PM for setup.",
      timestamp: new Date(2025, 9, 15, 10, 40),
      isOwn: false,
    },
    {
      id: "4",
      senderId: "staff1",
      senderName: "John Doe",
      content: "Perfect, I'll be there. Should I wear the standard uniform?",
      timestamp: new Date(2025, 9, 15, 10, 45),
      isOwn: true,
    },
  ];

  return (
    <div className="h-[600px] max-w-2xl mx-auto border rounded-lg">
      <MessageThread
        messages={messages}
        onSendMessage={(content) => console.log("Send message:", content)}
      />
    </div>
  );
}
