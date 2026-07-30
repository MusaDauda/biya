# Biya

**Premium Campus USDT Payments @ ABU**

Biya is a borderless financial operating system built exclusively for the Nigerian student. It enables students to pay campus vendors instantly in USDT with real-time Naira conversion, while providing vendors with a live dashboard to track sales and settlements.

## Features

- **For Students:**
  - **Scan to Pay:** Zero friction vendor payments. Point your camera, enter the Naira amount, and settle in USDT instantly.
  - **Instant & Secure:** Powered by the USDT network and Cleva's institutional custody.
  
- **For Vendors:**
  - **Live Dashboard:** Watch payments roll in on a live feed without touching a cash box.
  - **Automatic Settlement:** Daily takings are bundled and settled directly to your Cleva or bank account every night at 9 PM.
  - **Single QR Code:** One printable QR code for your whole stall.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS v4, Lucide React
- **Backend/BaaS:** Supabase (Auth, Database, Edge Functions)
- **Styling/Animations:** Framer Motion (motion/react), Custom Design Tokens (Geist, JetBrains Mono)
- **Tooling:** PostCSS, TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/biya-app.git
   cd biya-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy the example environment file and fill in your Supabase credentials.
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and other required secrets.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173).

## Database Schema

The database schema definitions are available in `supabase/schema.sql`. You can execute this file in your Supabase SQL Editor to set up the required tables and Row Level Security (RLS) policies.

## License

© 2024 Biya Financial Technologies. All rights reserved. Built for the modern Nigerian campus.