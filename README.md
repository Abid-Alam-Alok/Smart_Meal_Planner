# Smart Meal Planner

A comprehensive meal planning application built with Node.js, Express, and React.

## Project Structure

```
smart-meal-planner/
│
├── backend/                 # Node.js + Express (API & DB)
│   ├── src/
│   │   ├── config/          # DB connection, environment configs
│   │   ├── controllers/     # Business logic (User, Meal, Inventory, etc.)
│   │   ├── models/          # Mongoose schemas (User, Profile, Meal, Inventory...)
│   │   ├── routes/          # API routes (auth, meals, inventory, reports...)
│   │   ├── middlewares/     # Auth, error handling, validation
│   │   ├── utils/           # Helper functions (BMI calculation, expiry check, reports)
│   │   └── server.js        # Express app entry point
│   ├── package.json
│
├── frontend/                # React + Redux/Context
│   ├── public/
│   ├── src/
│   │   ├── api/             # Axios calls to backend
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Pages (Dashboard, Meals, Reports, Inventory, Login...)
│   │   ├── context/         # State management
│   │   ├── hooks/           # Custom hooks (useAuth, useInventory)
│   │   ├── utils/           # Frontend helpers
│   │   └── App.js
│   ├── package.json
│
├── docs/                    # Diagrams & documentation
├── .env                     # Environment variables
├── README.md
└── package.json             # Root dependencies (if monorepo)
```

## Getting Started

### Backend
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Frontend
1. Navigate to the frontend directory: `cd frontend/Smarty`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Environment Variables

Make sure to set up your environment variables in the `.env` file at the root level.

## Features

- User authentication and profiles
- Meal planning and management
- Inventory tracking
- Nutritional reports
- BMI calculation
- Expiry date monitoring

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, Vite
- **Database**: MongoDB
- **Rate Limiting**: Upstash Redis