import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const ReviewsSection = () => {
  const reviews = [
    { text: "Djeca su bila oduševljena, nismo ih mogli maknuti s napuhanca cijelo popodne.", name: "Ana K.", rating: 5 },
    { text: "Napuhanac je došao čist i uredan, sve je bilo kako smo se dogovorili.", name: "Marko P.", rating: 4.5 },
    { text: "Minecraft napuhanac je bio pun pogodak, klinci su bili oduševljeni.", name: "Ivana M.", rating: 5 },
    { text: "Jednorog je uživo još ljepši nego na slikama, stvarno super izgleda.", name: "Petra S.", rating: 5 },
    { text: "Jedini dino napuhanac koji mi se svidio u Zagrebu.", name: "Tomislav R.", rating: 4 },
    { text: "Brza dostava i jednostavan dogovor, bez ikakvog stresa.", name: "Marina B.", rating: 5 },
    { text: "Djeca su se cijeli dan igrala, a navečer su zaspala bez problema.", name: "Luka D.", rating: 4.5 },
    { text: "Napuhanac je bio stabilan i siguran, a mi svi mirni uz piće.", name: "Nina G.", rating: 5 },
    { text: "Odlična ideja za rođendan, definitivno ćemo opet uzeti.", name: "Hrvoje T.", rating: 4 },
    { text: "Cijena korektna za ono što smo dobili, klinci presretni.", name: "Sara V.", rating: 4.5 },
  ];

  // Duplicate reviews for seamless infinite scroll
  const duplicatedReviews = [...reviews, ...reviews];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Resume animation after a short delay
    setTimeout(() => setIsPaused(false), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 2000);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-warning text-warning" />);
    }
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative h-4 w-4">
          <Star className="absolute h-4 w-4 text-warning" />
          <div className="absolute overflow-hidden w-1/2">
            <Star className="h-4 w-4 fill-warning text-warning" />
          </div>
        </div>
      );
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-warning" />);
    }
    return stars;
  };

  return (
    <section className="py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-foreground mb-2">
          Što kažu <span className="text-primary">zadovoljni roditelji</span>
        </h2>
        <p className="text-muted-foreground text-center">Recenzije zadovoljnih roditelja i djece</p>
      </div>

      <div 
        className="relative cursor-grab active:cursor-grabbing select-none"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        style={{ 
          overflow: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div 
          className={`flex ${isPaused ? '' : 'animate-scroll-left-fast'}`}
          style={{ 
            animationPlayState: isPaused ? 'paused' : 'running',
            transform: isDragging ? 'none' : undefined
          }}
        >
          {duplicatedReviews.map((review, index) => (
            <Card 
              key={index} 
              className="flex-shrink-0 w-[320px] md:w-[380px] mx-3 border-2 hover:border-primary/20 transition-colors pointer-events-none"
            >
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">
                  {renderStars(review.rating)}
                </div>
                <p className="text-foreground mb-4 text-sm leading-relaxed">
                  "{review.text}"
                </p>
                <p className="text-primary font-semibold text-sm">
                  — {review.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <p className="text-center text-muted-foreground text-sm mt-4">
        ← Povuci za više recenzija →
      </p>
    </section>
  );
};

export default ReviewsSection;
