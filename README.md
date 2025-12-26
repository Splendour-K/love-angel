# Love Angel 💕# Welcome to your Lovable project



A modern dating app for university students, built with React, TypeScript, and Supabase.## Project info



## Features**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID



- 🔐 **Authentication** - Secure email/password and magic link authentication## How can I edit this code?

- 👤 **Profile Management** - Complete profiles with photos, bio, interests

- 📸 **Photo Upload** - Upload and manage profile photos with Supabase StorageThere are several ways of editing your application.

- 💝 **Swipe & Match** - Tinder-style swiping with mutual match detection

- 💬 **Real-time Chat** - Message your matches with real-time updates**Use Lovable**

- 🎓 **Student Verification** - University email verification system

- 🌙 **Dark/Light Mode** - Theme toggle supportSimply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.



## Tech StackChanges made via Lovable will be committed automatically to this repo.



- **Frontend**: React 18 + TypeScript + Vite**Use your preferred IDE**

- **Styling**: Tailwind CSS + shadcn/ui

- **Backend**: Supabase (Auth, Database, Storage, Realtime)If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

- **State Management**: TanStack Query

- **Routing**: React Router v6The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)



## Getting StartedFollow these steps:



### Prerequisites```sh

# Step 1: Clone the repository using the project's Git URL.

- Node.js 18+ and npmgit clone <YOUR_GIT_URL>

- A [Supabase](https://supabase.com) account

# Step 2: Navigate to the project directory.

### Local Developmentcd <YOUR_PROJECT_NAME>



1. **Clone the repository**# Step 3: Install the necessary dependencies.

   ```bashnpm i

   git clone https://github.com/Splendour-K/love-angel.git

   cd love-angel# Step 4: Start the development server with auto-reloading and an instant preview.

   ```npm run dev

```

2. **Install dependencies**

   ```bash**Edit a file directly in GitHub**

   npm install

   ```- Navigate to the desired file(s).

- Click the "Edit" button (pencil icon) at the top right of the file view.

3. **Set up environment variables**- Make your changes and commit the changes.

   

   Copy the example environment file:**Use GitHub Codespaces**

   ```bash

   cp .env.example .env- Navigate to the main page of your repository.

   ```- Click on the "Code" button (green button) near the top right.

   - Select the "Codespaces" tab.

   Fill in your Supabase credentials in `.env`:- Click on "New codespace" to launch a new Codespace environment.

   ```- Edit files directly within the Codespace and commit and push your changes once you're done.

   VITE_SUPABASE_PROJECT_ID="your-project-id"

   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"## What technologies are used for this project?

   VITE_SUPABASE_URL="https://your-project-id.supabase.co"

   ```This project is built with:



4. **Start the development server**- Vite

   ```bash- TypeScript

   npm run dev- React

   ```- shadcn-ui

   - Tailwind CSS

   Open [http://localhost:8080](http://localhost:8080) in your browser.

## How can I deploy this project?

### Available Scripts

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

| Command | Description |

|---------|-------------|## Can I connect a custom domain to my Lovable project?

| `npm run dev` | Start development server |

| `npm run build` | Build for production |Yes, you can!

| `npm run preview` | Preview production build |

| `npm run lint` | Run ESLint |To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

| `npm run type-check` | Run TypeScript type checking |

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **"New Project"**
4. Import your GitHub repository
5. Configure environment variables:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
6. Click **"Deploy"**

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### Post-Deployment Configuration

After deploying, update your Supabase project settings:

1. Go to your Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

## Supabase Setup

### Database Migrations

The project includes SQL migrations in `supabase/migrations/`. To apply them:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

### Storage Buckets

The app uses a public `avatars` bucket for profile photos. This is created automatically via migrations.

### Required Tables

- `profiles` - User profile data
- `matches` - Match/swipe records
- `conversations` - Chat conversations
- `messages` - Chat messages

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_URL` | Supabase project URL |

## Project Structure

```
love-angel/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   └── ui/          # shadcn/ui components
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Third-party integrations
│   │   └── supabase/    # Supabase client & types
│   ├── lib/             # Utility functions
│   └── pages/           # Page components
├── supabase/
│   └── migrations/      # Database migrations
├── .env.example         # Example environment variables
├── vercel.json          # Vercel deployment config
└── vite.config.ts       # Vite configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is private and proprietary.

---

Made with ❤️ using [React](https://react.dev), [Supabase](https://supabase.com), and [Vercel](https://vercel.com)
