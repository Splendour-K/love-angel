import { Mail, MessageCircleHeart } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen gradient-hero pb-24 pt-16 md:pt-20">
      <main className="container mx-auto px-4 max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <Mail className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Contact Us</h1>
            <p className="text-sm text-muted-foreground">We’re here to help students stay safe and connect well.</p>
          </div>
        </header>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4 text-muted-foreground">
          <p>
            Reach the UniMatch team for support, feedback, partnerships, or campus outreach.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Support:</strong> support@unimatch.app</li>
            <li><strong>Safety:</strong> safety@unimatch.app</li>
            <li><strong>Partnerships:</strong> campus@unimatch.app</li>
          </ul>
          <p className="flex items-center gap-2 text-foreground font-medium">
            <MessageCircleHeart className="w-4 h-4" />
            We aim to respond within one business day for student reports.
          </p>
        </div>
      </main>
    </div>
  );
}
