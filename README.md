# Aviation Permit Book

A white-label aviation permit management tool for flight departments, schedulers, and charter operations under 14 CFR 135.

## Features

- **203 Countries** with detailed permit requirements (overflight, landing private, landing charter)
- **Route Planner** with great circle calculations and FIR/permit analysis
- **Lead Time Calculator** for permit application deadlines
- **FBO Directory** with handler contacts worldwide
- **Team Collaboration** with organization-based data sharing
- **Conflict Resolution** for data updates
- **PWA Support** for mobile read-only access

## Tech Stack

- **Frontend**: Vanilla JS + Vite
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Maps**: Leaflet.js
- **PWA**: Service Worker with offline support

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aviation-permit-book
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your Firebase config values
   # Get these from Firebase Console > Project Settings

   # Update .firebaserc with your project ID
   ```

4. **Set up Firebase project**
   - Create a project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore Database
   - Generate a service account key for data migration

5. **Seed the database**
   ```bash
   # Place serviceAccountKey.json in project root
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Firebase Emulators (Optional)

For local development without affecting production:

```bash
# Start emulators
firebase emulators:start

# Set environment variable
VITE_USE_EMULATORS=true npm run dev
```

## Deployment

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

## Project Structure

```
aviation-permit-book/
├── public/              # Static assets, PWA files
├── src/
│   ├── components/      # UI components by feature
│   ├── config/          # Firebase & branding config
│   ├── services/        # Business logic (auth, firestore)
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Helpers
│   └── styles/          # CSS
├── data/                # Extracted JSON data
├── scripts/             # Build & migration scripts
└── firebase configs     # Rules, indexes, etc.
```

## User Roles

- **Admin**: Can approve new users, manage organization members
- **User**: Full access to permit data, notes, overrides

## Data Model

- **Organizations**: Team workspaces with branding
- **Users**: Belong to organizations, have roles
- **Countries**: Master permit data (read-only)
- **Country Overrides**: Org-specific edits with conflict detection
- **FBOs/Airports/FIRs**: Reference data

## PWA Behavior

When installed as a PWA, the app runs in read-only mode:
- View all permit data
- Search and filter
- Calculate routes
- No editing capabilities (use desktop for edits)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Private - All rights reserved
