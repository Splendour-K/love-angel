import { HeartHandshake } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen gradient-hero pb-24 pt-16 md:pt-20">
      <main className="container mx-auto px-4 max-w-4xl space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <HeartHandshake className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">About UniMatch</h1>
            <p className="text-sm text-muted-foreground">Built by students for students, focused on safety and authenticity.</p>
          </div>
        </header>

        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4 text-muted-foreground">
          <p>
            UniMatch is an international dating platform exclusively for verified university students.
            We combine rigorous verification with thoughtful design to make meeting people feel safe,
            respectful, and genuinely exciting.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Identity-first approach: university email + student ID verification.</li>
            <li>Safety at the core: reporting, blocking, and privacy controls.</li>
            <li>Meaningful connections: prompts, interests, and campus-friendly matching.</li>
            <li>Global community: inclusive of students everywhere.</li>
          </ul>
          <p>
            We partner with universities and student groups to keep the experience welcoming and trusted.
          </p>
        </div>
      </main>
    </div>
  );
}
