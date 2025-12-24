# Connect Meet

A modern social meetup platform where users can discover and join local events.

## 🚀 Live Demo
[https://connect-meet.vercel.app](https://connect-meet.vercel.app)

## 🛠️ Tech Stack
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth + Database)
- **Maps:** Leaflet
- **State Management:** TanStack Query
- **Build Tool:** Vite
- **Deployment:** Vercel

## ✨ Features
- 🔐 User authentication (signup/login)
- 📍 Interactive map view of meetups
- 🎯 Create and join events
- 👥 User profiles
- 📱 Responsive design

## 🏃 Running Locally
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/connect-meet.git
cd connect-meet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Run dev server
npm run dev
```

## 📝 Environment Variables

Create a `.env.local` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📄 License
MIT
