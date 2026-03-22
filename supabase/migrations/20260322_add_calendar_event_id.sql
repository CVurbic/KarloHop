-- Add Google Calendar event ID to bookings for tracking synced events
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_calendar_event_id text DEFAULT NULL;
