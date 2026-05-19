import { supabase } from './supabase';

export type ParkingSpot = {
  id: string;
  user_id: string;
  street_name: string;
  street_number: string;
  parking_number: string;
  latitude: number;
  longitude: number;
  available_from: string;
  available_to: string;
  price_per_hour: number;
  created_at: string;
};

export type Booking = {
  id: string;
  spot_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  paid: boolean;
  created_at: string;
  parking_spots?: ParkingSpot;
};

export type PinColor = 'red' | 'yellow' | 'green' | 'blue';

export async function deleteExpiredSpots(): Promise<void> {
  const nowIso = new Date().toISOString();
  await supabase.from('parking_spots').delete().lt('available_to', nowIso);
}

export async function fetchAllSpots(): Promise<ParkingSpot[]> {
  await deleteExpiredSpots();
  const { data, error } = await supabase.from('parking_spots').select('*');
  if (error) throw error;
  return (data ?? []) as ParkingSpot[];
}

export async function fetchAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase.from('bookings').select('*');
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function createSpot(spot: Omit<ParkingSpot, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('parking_spots').insert(spot).select().single();
  if (error) throw error;
  return data as ParkingSpot;
}

export async function deleteSpot(id: string) {
  const { error } = await supabase.from('parking_spots').delete().eq('id', id);
  if (error) throw error;
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'parking_spots'>) {
  const { data, error } = await supabase.from('bookings').insert(booking).select().single();
  if (error) throw error;
  return data as Booking;
}

export async function fetchUserSpots(userId: string): Promise<ParkingSpot[]> {
  await deleteExpiredSpots();
  const { data, error } = await supabase
    .from('parking_spots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ParkingSpot[];
}

export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, parking_spots(*)')
    .eq('user_id', userId)
    .order('start_time', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export function getSpotColor(
  spot: ParkingSpot,
  bookings: Booking[],
  currentUserId: string | undefined
): PinColor {
  if (spot.user_id === currentUserId) return 'blue';

  const now = new Date();
  const spotBookings = bookings.filter(b => b.spot_id === spot.id);

  const active = spotBookings.find(
    b => new Date(b.start_time) <= now && new Date(b.end_time) > now
  );
  if (active) return 'red';

  const thirtyMin = 30 * 60 * 1000;
  const transitioning = spotBookings.find(b => {
    const start = new Date(b.start_time).getTime();
    const end = new Date(b.end_time).getTime();
    const nowMs = now.getTime();
    return (start > nowMs && start - nowMs <= thirtyMin) || (end > nowMs && end - nowMs <= thirtyMin);
  });
  if (transitioning) return 'yellow';

  return 'green';
}

export const BRASOV_BOUNDS = {
  sw: [25.48, 45.58] as [number, number],
  ne: [25.70, 45.72] as [number, number],
};

export async function reverseGeocode(lng: number, lat: number, token: string): Promise<{ street: string; number: string }> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address&language=ro&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  const f = data.features?.[0];
  if (!f) return { street: '', number: '' };
  const street = f.text ?? '';
  const number = f.address ?? '';
  return { street, number };
}
