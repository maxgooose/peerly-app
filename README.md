<<<<<<< HEAD
# Peerly - Student Study Matching App 🎓
=======
# Peerly
BUILT BY 
HAMZA ZACK RODNEY SAFWAN
>>>>>>> 036ed4e539e4f5e0bcdf559fc553b7f557c1b233

A mobile application that intelligently matches university students for study partnerships using AI-powered compatibility scoring, real-time chat, and study group management.

## 🌟 Features

- **Smart Student Matching**
  - AI-powered compatibility scoring
  - University-based matching
  - Subject and availability matching
  - Study style compatibility
  
- **Real-time Chat System**
  - Instant messaging
  - Message pagination
  - Optimistic updates
  - Multi-user conversations
  
- **Study Groups (Nests)**
  - Create and join study groups
  - Subject-based organization
  - Group chat functionality
  
- **User Profiles**
  - Academic information
  - Study preferences
  - Schedule availability
  - Progress tracking

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase Account](https://supabase.com)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd peerly-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Supabase and Gemini credentials.

4. Start the development server:
```bash
npm start
```

### Database Setup

1. Run the initial migrations:
```bash
cd supabase
# Run migrations in order from migrations folder
```

2. Set up test data (optional):
```bash
# Run the test data scripts from sql/test-data/
```

## 🏗 Project Structure

```
peerly-app/
├── app/                 # Expo Router app screens
│   ├── (auth)/         # Authentication screens
│   ├── (tabs)/         # Main tab screens
│   ├── chat/           # Chat related screens
│   ├── nest/           # Study group screens
│   └── onboarding/     # User onboarding flow
├── src/
│   ├── api/            # API endpoints
│   ├── components/     # Reusable components
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── utils/          # Helper functions
├── supabase/           # Supabase configuration
│   ├── functions/      # Edge functions
│   └── migrations/     # Database migrations
└── docs/               # Documentation
```

## 🛠 Tech Stack

- **Frontend**
  - React Native with Expo
  - TypeScript
  - React Navigation
  - Expo Router
  
- **Backend**
  - Supabase
  - PostgreSQL
  - Real-time subscriptions
  - Edge Functions
  
- **AI/ML**
  - Google Gemini API
  - Custom matching algorithm

## 📱 Core Features Details

### Auto-Matching System
- Compatibility scoring (100 points max)
- University matching (20 pts)
- Subject overlap (30 pts)
- Availability matching (20 pts)
- Study style compatibility (15 pts)
- Study goals alignment (10 pts)
- Year proximity (5 pts)

### Chat System
- Real-time messaging
- Message pagination (50 messages per load)
- Optimistic updates
- Message status tracking
- AI-generated conversation starters

### Study Nests
- Group creation and management
- Subject-based organization
- Member roles and permissions
- Group chat functionality

## 🔒 Security

- Row Level Security (RLS)
- Email verification
- University email validation
- Rate limiting
- Input sanitization
- File upload security

## 📈 Current Status

- **Phase:** 5/14 Complete
- **Progress:** 36%
- **MVP Readiness:** Core features implemented
- **Next Steps:** Image sharing, security hardening, and testing

## 🧪 Testing

1. Run the test suite:
```bash
npm test
```

2. Create test data:
```bash
cd sql/test-data
# Run the appropriate test data script
```

Refer to `docs/testing/TESTING_GUIDE.md` for detailed testing procedures.

## 📚 Documentation

- [Project Status](docs/PROJECT_STATUS.md)
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)
- [Chat System Plan](docs/CHAT_SYSTEM_IMPLEMENTATION_PLAN.md)
- [Matching System](MATCHING_SYSTEM_README.md)
- [Badge System](docs/BADGE_SYSTEM.md)
- [Quick Start Guide](docs/TEAM_QUICK_START.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

Private project - All rights reserved

## 🙋‍♂️ Support

For support, check the documentation in the `docs/` folder or create an issue in the repository.

---

Built with ❤️ for university students

Developed by: Hamza Harb, Zachary Arrastia, Safwan Chowdhury & Rodney Scott
