# RoomFindr

A comprehensive web-based room finder and rental application built with Next.js 14+ and Supabase.

## Features

- **Role-based Authentication**: Admin, Tenant, and Landlord user types
- **Landlord Verification**: Document verification system for landlord authenticity
- **Property Management**: Create, update, and manage property listings
- **Advanced Search**: Filter properties by price, location, room type, and amenities
- **Reservation System**: Secure booking with payment processing
- **Real-time Notifications**: Stay updated on reservations and announcements
- **Review System**: Rate and review properties and landlords
- **Admin Dashboard**: Comprehensive platform management tools

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and App Router
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Authentication**: Supabase Auth with Row Level Security (RLS)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd roomfindr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── property/       # Property-related components
│   ├── search/         # Search components
│   ├── reservation/    # Reservation components
│   ├── admin/          # Admin components
│   └── common/         # Common components (Layout, Header, etc.)
├── lib/                # Utility functions and configurations
│   ├── supabase.ts     # Supabase client configuration
│   ├── api.ts          # API functions
│   └── utils.ts        # Utility functions
└── types/              # TypeScript type definitions
    ├── index.ts        # User and auth types
    ├── property.ts     # Property-related types
    └── reservation.ts  # Reservation and transaction types
```

## Database Setup

The application requires a Supabase database with the following tables:
- `users` - User accounts and profiles
- `properties` - Property listings
- `reservations` - Booking records
- `transactions` - Payment transactions
- `notifications` - User notifications
- `reviews` - Property and landlord reviews
- `landlord_verifications` - Verification documents and status

Refer to the design document for detailed schema information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
