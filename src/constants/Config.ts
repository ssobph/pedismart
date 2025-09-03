// EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
// EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;

const Config = {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
    
    maxPassengersPerTrip: 6,
    
    isDevelopment,
    isProduction: !isDevelopment,
};

function validateConfig() {
    const missingVars: string[] = [];
    
    if (!Config.supabaseUrl) {
        missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
    }
    
    if (!Config.supabaseAnonKey) {
        missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }
    
    if (!Config.mapboxAccessToken) {
        missingVars.push('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN');
    }
    
    if (missingVars.length > 0) {
        const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}\n` +
            `Please ensure these are set in your .env file or EAS build configuration.`;
        
        if (Config.isProduction) {
            throw new Error(errorMessage);
        } else {
            console.error(errorMessage);
            console.warn('🚧 App will run with limited functionality in development mode.');
        }
    }
}

validateConfig();

export default Config;