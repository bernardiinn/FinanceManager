# 💳 Controle de Cartões - Card Lending Manager

A modern, production-ready Progressive Web App for managing credit cards lent to friends and family members.

## 🎯 Features

- **👥 Person Management**: Add, edit, and organize people who have borrowed your cards
- **💳 Card Tracking**: Monitor each card's total value, installments, and payment progress
- **📊 Financial Dashboard**: Real-time overview of total lent, received, and outstanding amounts
- **📱 Mobile-First Design**: Responsive interface optimized for both mobile and desktop
- **🔒 Privacy**: All data stored locally with optional backup/export
- **⚡ PWA Support**: Install as a native app with offline capabilities
- **🌙 Dark Mode**: Toggle between light and dark themes
- **📈 Analytics**: Visual insights into lending patterns and payment history

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6.3.5 (ultra-fast HMR)
- **Routing**: React Router DOM 7.6.2
- **Icons**: React Icons 5.5.0
- **PWA**: Vite PWA Plugin
- **Styling**: Modern CSS with custom properties
- **State**: React hooks + Backend SQLite database + JWT session authentication

## 🛠️ Development

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Project Structure
```
src/
├── components/        # Reusable UI components
├── pages/            # Route components
├── services/         # Business logic and data management
├── hooks/            # Custom React hooks
├── styles/           # Global styles and themes
├── utils/            # Helper functions
└── types.ts          # TypeScript type definitions
```

## 📱 Usage

1. **Add People**: Start by adding friends/family who have borrowed your cards
2. **Register Cards**: For each person, add their borrowed cards with payment details
3. **Track Payments**: Update payment progress as installments are paid
4. **Monitor Dashboard**: View real-time financial overview and analytics
5. **Export Data**: Backup your data or generate reports

## 🔧 Configuration

The app supports customization through:
- **Theme Settings**: Light/dark mode toggle
- **Currency Format**: Localized currency display
- **Notification Preferences**: Payment reminders and alerts
- **Data Export**: JSON, CSV, or PDF formats

## 📊 Analytics Features

- Monthly lending/receiving reports
- Payment completion rates
- Person-wise debt analysis
- Overdue payment tracking
- Visual charts and graphs

## 🔒 Privacy & Security

- All data stored locally in browser
- No external data transmission
- Optional passcode protection
- Secure data export options
- Regular backup reminders

## 🌐 PWA Features

- Install as native app
- Offline functionality
- Push notifications (optional)
- Fast loading and caching
- Cross-platform compatibility

## 📝 License

MIT License - feel free to use for personal projects
