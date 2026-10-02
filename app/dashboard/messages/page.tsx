import SendSmsForm from "@/components/messages/SendSmsForm";

export default function MessagesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Send SMS</h1>
      <SendSmsForm />
    </div>
  );
}
