export default function SettingsPage() {
  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <div>
          <h2 className="font-semibold mb-1">Twilio Configuration</h2>
          <p className="text-sm text-gray-500">Configure via environment variables in <code className="bg-gray-100 px-1 rounded">.env</code></p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li><code className="bg-gray-100 px-1 rounded">TWILIO_ACCOUNT_SID</code></li>
            <li><code className="bg-gray-100 px-1 rounded">TWILIO_AUTH_TOKEN</code></li>
            <li><code className="bg-gray-100 px-1 rounded">TWILIO_MESSAGING_SERVICE_SID</code></li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="font-semibold mb-1">Webhook URLs</h2>
          <p className="text-sm text-gray-500 mb-2">Configure these in your Twilio Messaging Service:</p>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Incoming Message:</span>
              <code className="block bg-gray-100 px-2 py-1 rounded mt-1 text-xs break-all">
                {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/incoming
              </code>
            </div>
            <div>
              <span className="text-gray-500">Status Callback:</span>
              <code className="block bg-gray-100 px-2 py-1 rounded mt-1 text-xs break-all">
                {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
