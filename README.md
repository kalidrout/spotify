# 🎵 SoundStream

A modern, feature-rich music streaming platform built with React, Supabase, and TypeScript. Stream your favorite tracks, create playlists, and discover new artists - all in one place.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Features

- 🎵 Seamless audio playback with advanced controls
- 📱 Modern, responsive UI built with Tailwind CSS
- 🎨 Beautiful album artwork and player interface
- 📊 Play tracking and listening history
- 👥 User authentication and profiles
- 📝 Playlist creation and management
- 🎨 Artist profiles and submissions
- 💎 Premium subscription support
- 🔒 Row-level security with Supabase

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kalidrout/spotify.git
cd soundstream
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
pnpm supabase migration up
```

5. Start the development server:
```bash
pnpm dev
```

## 🏗️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Supabase
  - Authentication
  - Database
  - Storage
  - Row Level Security
- **State Management**: React Context
- **Audio Processing**: Web Audio API
- **Package Manager**: pnpm

## 📁 Project Structure

```
soundstream/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── lib/           # Utility libraries
│   ├── pages/         # Page components
│   └── types/         # TypeScript types
├── supabase/
│   └── migrations/    # Database migrations
└── public/           # Static assets
```

## 🔒 Security

- Row Level Security (RLS) policies ensure data privacy
- Secure authentication with Supabase Auth
- Protected API routes and storage buckets
- Subscription-based access control

## 🎯 Future Enhancements

- [ ] Offline mode support
- [ ] Mobile applications
- [ ] Social features (sharing, following)
- [ ] Advanced recommendation system
- [ ] Collaborative playlists
- [ ] Audio visualization
- [ ] Podcast support

## 📄 License

This project is licensed under the Apache 2.0 License 

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💖 Support

Give a ⭐️ if you like this project!
