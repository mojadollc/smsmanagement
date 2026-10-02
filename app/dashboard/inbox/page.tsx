import InboxView from "@/components/inbox/InboxView";

export default function InboxPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">SMS Inbox</h1>
      <InboxView />
    </div>
  );
}
