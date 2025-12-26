import { ShieldAlert } from 'lucide-react';

export default function Safety() {
  return (
    <div className="min-h-screen gradient-hero pb-24 pt-16 md:pt-20">
      <main className="container mx-auto px-4 max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <ShieldAlert className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Safety Center</h1>
            <p className="text-sm text-muted-foreground">Guidelines, reporting, and support resources.</p>
          </div>
        </header>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4 text-muted-foreground">
          <p>
            UniMatch is built for respectful, authentic connections. Please follow these community standards
            to keep everyone safe.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Use your real identity and stay truthful about your university status.</li>
            <li>Be kind. No harassment, discrimination, or unwanted behavior.</li>
            <li>Never share passwords, financial info, or verification codes.</li>
            <li>Meet in public spaces and tell a friend when meeting someone new.</li>
            <li>Report concerns quickly; our team prioritizes student safety.</li>
          </ul>
          <p>
            If you experience harm or see suspicious behavior, report it in-app or email safety@unimatch.app.
            We respond quickly and can restrict accounts while we investigate.
          </p>
        </div>
      </main>
    </div>
  );
}
