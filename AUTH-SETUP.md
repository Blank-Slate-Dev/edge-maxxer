# Edge Maxxer Authentication Setup

## 1. Install Dependencies

```bash
npm install next-auth mongoose bcryptjs
npm install -D @types/bcryptjs
```

## 2. Set Up MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free cluster
2. Create a database user with password
3. Get your connection string (click "Connect" → "Connect your application")
4. Add your IP to the whitelist (or allow all IPs with 0.0.0.0/0 for development)

## 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Required variables:
- `MONGODB_URI` - Your MongoDB connection string
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

Optional (for Google Sign-In):
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

## 4. File Structure

Place these files in your project:

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── signup/
│   │       └── route.ts
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
├── components/
│   └── AuthProvider.tsx
├── lib/
│   ├── auth.ts
│   ├── mongodb.ts
│   └── models/
│       └── User.ts
├── types/
│   └── next-auth.d.ts
└── middleware.ts
```

## 5. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
7. Copy Client ID and Client Secret to `.env.local`

## 6. Test It

1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000/signup
3. Create an account
4. You should be redirected to /dashboard

## User Model Features

Each user has:
- `name`, `email`, `password` (hashed)
- `subscription`: 'none' | 'trial' | 'active' | 'expired'
- `trialEndsAt`: 7 days from signup
- `referralCode`: Auto-generated unique code
- `oddsApiKey`: For storing their BYOK API key
- `stripeCustomerId`: For Stripe integration later

## Protected Routes

The middleware protects:
- `/dashboard/*`
- `/settings/*`
- `/api/arbs/*`
- `/api/lines/*`

Unauthenticated users are redirected to `/login`.
