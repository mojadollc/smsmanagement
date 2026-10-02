import CampaignForm from "@/components/campaigns/CampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
      <CampaignForm />
    </div>
  );
}
