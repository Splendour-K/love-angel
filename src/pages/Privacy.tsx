import { Shield, AlertTriangle } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen gradient-hero pb-24 pt-16 md:pt-20">
      <main className="container mx-auto px-4 max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">How we protect your data and safety.</p>
          </div>
        </header>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4 text-muted-foreground">
          <p>
            We keep student safety and privacy at the core of UniMatch. Verification, encryption, and
            moderation safeguards ensure only verified students can interact and your personal data remains
            protected.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>University email + student ID verification to keep the community safe.</li>
            <li>Granular control over what you share on your profile and in chats.</li>
            <li>Reporting, blocking, and audit systems to rapidly act on unsafe behavior.</li>
            <li>Data minimization and secure storage aligned with student privacy expectations.</li>
          </ul>
          <p>
            For detailed policies or data requests, contact privacy@unimatch.app. We respond quickly to
            student safety concerns.
          </p>
        </div>

        {/* Message Monitoring Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-400 mb-2">
                Message Monitoring Notice
              </h2>
              <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                To ensure the safety of our community and comply with applicable laws, all messages sent 
                through UniMatch may be monitored, recorded, and reviewed by our trust and safety team. 
                This includes direct messages between users.
              </p>
            </div>
          </div>
          
          <div className="pl-9 space-y-3 text-amber-700 dark:text-amber-300 text-sm">
            <p><strong>What we monitor:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All text messages exchanged between users</li>
              <li>Reported conversations for policy violations</li>
              <li>Patterns of harassment, spam, or inappropriate content</li>
            </ul>
            
            <p className="mt-3"><strong>Why we monitor:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>To protect users from harassment and abuse</li>
              <li>To enforce our community guidelines</li>
              <li>To respond to safety reports and legal requests</li>
              <li>To maintain a safe dating environment for students</li>
            </ul>
            
            <p className="mt-3 text-amber-600 dark:text-amber-400 font-medium">
              By using UniMatch, you acknowledge and consent to this monitoring. If you do not agree 
              with this policy, please do not use our messaging features.
            </p>
          </div>
        </div>

        {/* ID Verification Section */}
        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">ID Verification</h2>
          <p className="text-muted-foreground">
            Users may optionally verify their identity by submitting a government-issued ID or student ID. 
            Verified users receive a blue checkmark badge on their profile.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
            <li>ID documents are securely stored and only accessible by authorized administrators</li>
            <li>Documents are reviewed manually to confirm identity</li>
            <li>Verification status is displayed on your profile to build trust</li>
            <li>You may request deletion of your ID documents at any time</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
