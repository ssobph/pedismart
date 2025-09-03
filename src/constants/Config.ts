// EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
// EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

const Config = {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
    
    // Business Rules
    maxPassengersPerTrip: 6,
};

if (!Config.supabaseUrl || !Config.supabaseAnonKey) {
    console.error(
        "Supabase environment variables are missing. Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
    Config.supabaseUrl = "https://placeholder.supabase.co";
    Config.supabaseAnonKey = "placeholder-anon-key";
}

if (!Config.mapboxAccessToken) {
    console.warn("Mapbox access token is missing or using placeholder. Map features will not work properly.");
}

export default Config;