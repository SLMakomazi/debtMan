# Debt Manager

A modern web application for managing debts and payments with a clean, intuitive interface.

## 🚀 Features

- **User Authentication** - Secure login and registration system
- **Dashboard** - Overview of your financial status
- **Payments Management** - Track and manage all your payments
- **Responsive Design** - Works on desktop and mobile devices
- **Real-time Updates** - See changes immediately

## 🛠️ Tech Stack

- **Frontend**: React.js, React Router, Context API
- **Styling**: CSS3, CSS Modules
- **Build Tool**: Vite
- **Version Control**: Git

## 📦 Prerequisites

- Node.js (v14 or later)
- npm (v6 or later) or Yarn

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/debt-manager.git
   cd debt-manager
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # OR using Yarn
   yarn
   ```

3. **Set up environment variables**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

4. **Start the development server**
   ```bash
   # Frontend
   cd frontend
   npm run dev
   ```

5. **Open in browser**
   The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
debtMan/
├── frontend/             # Frontend React application
│   ├── public/          # Static files
│   └── src/             # Source code
│       ├── components/  # Reusable UI components
│       ├── pages/       # Page components
│       ├── context/     # React context providers
│       └── services/    # API services
└── backend/             # Backend server
    ├── config/         # Configuration files
    ├── controllers/    # Route controllers
    ├── models/         # Database models
    └── routes/         # API routes
```

## 🌐 Branches

- `main` - Production-ready code
- `dev` - Development branch (default)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)
