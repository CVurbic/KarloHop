import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Moon, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LATE_PICKUP_PRICE } from "@/lib/lateNightPickup";

interface LateNightUpsellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** URL-encoded night hero image of the selected inflatable. */
  imageSrc: string;
  /** Display name of the selected inflatable (for alt text). */
  bounceHouseName: string;
  /** User accepted the add-on. */
  onAccept: () => void;
  /** User declined and wants to continue with the booking. */
  onDecline: () => void;
}

/**
 * Upsell interstitial shown after "Rezerviraj" when the customer did not tick
 * the late night pickup toggle. It presents the "at night" image of the exact
 * inflatable they chose, the +30€ price and what the add-on includes, then lets
 * them add it or continue without it.
 */
const LateNightUpsellDialog = ({
  open,
  onOpenChange,
  imageSrc,
  bounceHouseName,
  onAccept,
  onDecline,
}: LateNightUpsellDialogProps) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* z-[2000]: above Leaflet's own controls (AddressPicker map uses z-index:1000) so the
            upsell doesn't render behind the delivery-address map. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[2000] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%]",
            "overflow-hidden rounded-2xl bg-[#1c1f26] text-white shadow-2xl",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Hero: night image of the chosen inflatable */}
          <div className="relative bg-gradient-to-b from-[#0f3a63] to-[#0b2c4d]">
            <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-current" />
              Samo večeras
            </div>
            <Moon className="absolute right-4 top-4 z-10 h-7 w-7 text-white/90" />
            <img
              src={imageSrc}
              alt={`${bounceHouseName} noću`}
              className="h-56 w-full object-contain p-4"
              loading="eager"
            />
          </div>

          {/* Body */}
          <div className="space-y-4 p-6">
            <DialogPrimitive.Title className="text-2xl font-bold leading-tight">
              Neka zabava traje do kasno
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm leading-relaxed text-white/70">
              Produžite druženje u večer — dolazimo po napuhanac tek nakon 22:00.
              Više vremena za slavlje, bez žurbe.
            </DialogPrimitive.Description>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">+{LATE_PICKUP_PRICE} €</span>
              <span className="text-sm text-white/60">uz vaš termin</span>
            </div>

            <button
              type="button"
              onClick={onAccept}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2b7fff] px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#1f6fe8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2b7fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1f26]"
            >
              <Plus className="h-5 w-5" />
              Dodaj kasno preuzimanje
            </button>

            <button
              type="button"
              onClick={onDecline}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Ne, hvala — nastavi
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default LateNightUpsellDialog;
