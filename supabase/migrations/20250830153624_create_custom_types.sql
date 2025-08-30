create type public.user_role as enum ('passenger', 'driver');
create type public.driver_status as enum ('online', 'offline', 'on_trip');
create type public.trip_status as enum ('requested', 'accepted', 'in_progress', 'completed', 'cancelled');
create type public.waypoint_type as enum ('pickup', 'dropoff');
create type public.waypoint_status as enum ('pending', 'completed');
