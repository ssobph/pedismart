// EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
// EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

const Config = {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
};

if (!Config.supabaseUrl || !Config.supabaseAnonKey || !Config.mapboxAccessToken) {
    throw new Error(
        "ENV MISSING."
    );
}

export default Config;