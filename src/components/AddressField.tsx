import { Component, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import AddressPicker from "@/components/AddressPicker";
import type { LatLng } from "@/lib/geo";

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  onLocationChange: (loc: LatLng | null) => void;
  onBlur?: () => void;
  placeholder?: string;
};

// AddressPicker (Leaflet karta) uz fallback: ako karta pukne pri renderu,
// polje se degradira na obični text input. Rezervacija svejedno prolazi —
// create_public_booking prima p_lat/p_lng kao null.
export default class AddressField extends Component<Props, { crashed: boolean }> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(err: unknown) {
    console.error("AddressPicker pao, fallback na plain input:", err);
  }

  render(): ReactNode {
    const { value, onValueChange, onBlur, placeholder } = this.props;
    if (this.state.crashed) {
      return (
        <Input
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={onBlur}
        />
      );
    }
    return <AddressPicker {...this.props} />;
  }
}
