// components/LazyCard.js
import { useState, useEffect, useRef } from 'react';
import BookCard from './BookCard';
import BlogCard from './BlogCard';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';

export default function LazyCard({ 
  type = 'book', 
  coverUrl, 
  title, 
  className = "",
  threshold = 0.1 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Add a small delay for staggered loading effect
          setTimeout(() => setIsLoaded(true), Math.random() * 200);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const CardComponent = {
    book: BookCard,
    blog: BlogCard,
    product: ProductCard
  }[type];

  return (
    <div ref={cardRef} className={className}>
      {!isVisible ? (
        <SkeletonCard />
      ) : !isLoaded ? (
        <SkeletonCard />
      ) : (
        <CardComponent 
          coverUrl={coverUrl} 
          title={title}
          className="animate-fade-in"
        />
      )}
    </div>
  );
}
