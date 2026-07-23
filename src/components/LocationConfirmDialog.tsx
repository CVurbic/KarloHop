import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMaps";

interface LocationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  lat: number;
  lng: number;
  onConfirm: (address: string, lat: number, lng: number) => void;
}

const LocationConfirmDialog = ({ open, onOpenChange, address, lat, lng, onConfirm }: LocationConfirmDialogProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentAddress(address);
    setCurrentLat(lat);
    setCurrentLng(lng);
    setIsReady(false);

    let cancelled = false;

    loadGoogleMaps().then((g) => {
      if (cancelled || !mapRef.current) return;

      const position = { lat, lng };
      const map = new g.maps.Map(mapRef.current, {
        center: position,
        zoom: 17,
        streetViewControl: false,
        mapTypeControl: false,
      });

      const marker = new g.maps.Marker({ position, map, draggable: true });
      geocoderRef.current = new g.maps.Geocoder();
      markerRef.current = marker;

      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (!pos) return;
        setCurrentLat(pos.lat());
        setCurrentLng(pos.lng());
        geocoderRef.current?.geocode({ location: pos }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            setCurrentAddress(results[0].formatted_address);
          }
        });
      });

      setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [open, address, lat, lng]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Potvrdite lokaciju dostave
          </DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full rounded-lg overflow-hidden bg-muted">
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <div ref={mapRef} className="h-full w-full" />
        </div>

        <p className="text-sm text-muted-foreground">{currentAddress}</p>
        <p className="text-xs text-muted-foreground">Povucite oznaku ako lokacija nije točna.</p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button onClick={() => onConfirm(currentAddress, currentLat, currentLng)}>
            Potvrdi lokaciju
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationConfirmDialog;
