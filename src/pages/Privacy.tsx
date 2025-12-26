import { Shield } from 'lucide-react';

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
      </main>
    </div>
  );
}
