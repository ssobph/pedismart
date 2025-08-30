# PediSmart - Smart Transport for Everyone

A React Native mobile application for real-time path optimization and driver-passenger pairing in informal transport systems.

## Features

### 🚗 **Passenger App**
- **Find Ride**: Map view with available pedicabs and location inputs
- **Driver Selection**: Choose from available drivers with ratings and performance metrics
- **Booking Management**: View current rides and ride history
- **Profile Management**: User profile, settings, and preferences

### 👨‍🦱 **Driver App**
- **Dashboard**: Online/offline toggle, earnings overview, and ride requests
- **Ride Management**: Active rides, trip controls, and ride history
- **Earnings Tracking**: Daily, weekly, and monthly earnings with transaction history
- **Profile & Stats**: Driver profile, ratings, and performance metrics

### 🔧 **Core Features**
- **Real-Time Tracking**: Live location updates and route optimization
- **Multi-Sharing**: Efficient ride sharing with multiple passengers
- **Smart Pairing**: AI-powered driver-passenger pairing
- **Role-Based Access**: Separate interfaces for passengers and drivers

## Screenshots

The app includes the following key screens:

1. **Splash Screen** - App introduction with features overview
2. **Role Selection** - Choose between passenger and driver roles
3. **Authentication** - Login and signup with role-based forms
4. **Passenger Screens**:
   - Find Ride (main screen with map and location inputs)
   - Driver Selection (choose from available drivers)
   - My Rides (current rides and history)
   - Profile (user settings and preferences)
5. **Driver Screens**:
   - Dashboard (earnings, stats, and ride requests)
   - My Rides (active and completed rides)
   - Earnings (financial tracking and transactions)
   - Profile (driver settings and vehicle info)

## Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router
- **UI Components**: Custom components with React Native StyleSheet
- **Icons**: FontAwesome5 and Expo Vector Icons
- **Styling**: Modern design with gradients and shadows

## Project Structure

```
pedismart2/
├── app/
│   ├── _layout.tsx              # Main app layout
│   ├── index.tsx                # Splash screen
│   ├── role-selection.tsx       # Role selection screen
│   ├── auth.tsx                 # Authentication screen
│   ├── passenger/               # Passenger app screens
│   │   ├── _layout.tsx         # Passenger tab navigation
│   │   ├── index.tsx           # Find Ride screen
│   │   ├── manual-booking.tsx  # Available Pedicabs screen
│   │   ├── bookings.tsx        # My Rides screen
│   │   └── profile.tsx         # Profile screen
│   └── driver/                  # Driver app screens
│       ├── _layout.tsx         # Driver tab navigation
│       ├── index.tsx           # Dashboard screen
│       ├── rides.tsx           # My Rides screen
│       ├── earnings.tsx        # Earnings screen
│       └── profile.tsx         # Profile screen
├── components/                   # Reusable components
├── constants/                    # App constants and colors
├── hooks/                       # Custom React hooks
└── assets/                      # Images, fonts, and other assets
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- React Native development environment

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pedismart2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web
   npm run web
   ```

## Key Dependencies

- `expo`: ~53.0.20
- `react-native`: 0.79.5
- `expo-router`: ~5.1.4
- `expo-linear-gradient`: ~14.0.0
- `expo-location`: ~18.0.0
- `react-native-maps`: 1.10.0
- `@expo/vector-icons`: ^14.1.0
- `react-native-vector-icons`: ^10.0.3

## App Flow

1. **Splash Screen** → App introduction and features
2. **Role Selection** → Choose passenger or driver role
3. **Authentication** → Login/signup (optional)
4. **Main App** → Role-specific interface with tab navigation

### Passenger Flow
- Find Ride → Select pickup/destination → Choose driver → Confirm booking
- View ride status → Rate driver after completion

### Driver Flow
- Go online → Receive ride requests → Accept/decline → Complete trip
- Track earnings → View performance metrics

## Design Principles

- **Clean UI/UX**: Modern, intuitive interface design
- **Role-Based Design**: Separate experiences for passengers and drivers
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Clear navigation and readable text
- **Performance**: Optimized for smooth user experience

## Future Enhancements

- **Backend Integration**: Connect to Node.js backend with Supabase
- **Real-Time Features**: WebSocket integration for live updates
- **Maps Integration**: Google Maps or Mapbox integration
- **Push Notifications**: Real-time ride updates
- **Payment Integration**: In-app payment processing
- **Multi-Language Support**: Localization for different regions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**PediSmart** - Making informal transport smarter, one ride at a time! 🚗✨
