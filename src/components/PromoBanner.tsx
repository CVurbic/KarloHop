import { useEffect, useState, useRef } from "react";

const PromoBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const promoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Find the promo section in ProductShowcase
      const promoSection = document.querySelector('[data-promo-section]');
      if (!promoSection) return;

      const rect = promoSection.getBoundingClientRect();
      const sectionHeight = rect.height;
      const scrolledPast = rect.top + sectionHeight * 0.5 < 0;

      setIsVisible(scrolledPast);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 gradient-fun overflow-hidden">
      <div className="animate-scroll-banner whitespace-nowrap py-2">
        <span className="inline-block text-white font-semibold text-sm md:text-base px-8">
          🎉 Drugi dan 50% povoljniji! Produžite zabavu još jedan dan uz nevjerojatnu uštedu! 🎉
        </span>
        <span className="inline-block text-white font-semibold text-sm md:text-base px-8">
          🎉 Drugi dan 50% povoljniji! Produžite zabavu još jedan dan uz nevjerojatnu uštedu! 🎉
        </span>
        <span className="inline-block text-white font-semibold text-sm md:text-base px-8">
          🎉 Drugi dan 50% povoljniji! Produžite zabavu još jedan dan uz nevjerojatnu uštedu! 🎉
        </span>
        <span className="inline-block text-white font-semibold text-sm md:text-base px-8">
          🎉 Drugi dan 50% povoljniji! Produžite zabavu još jedan dan uz nevjerojatnu uštedu! 🎉
        </span>
      </div>
    </div>
  );
};

export default PromoBanner;