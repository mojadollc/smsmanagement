import SendSmsForm from "@/components/messages/SendSmsForm";

export default function MessagesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Send SMS</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Send a single message to a customer immediately</p>
      </div>
      <SendSmsForm />
    </div>
  );
}
