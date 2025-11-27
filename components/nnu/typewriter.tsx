"use client";

import { useState, useEffect } from "react";

interface TypewriterProps {
  text: string;
  delay?: number;
  deleteDelay?: number;
  pauseTime?: number;
  className?: string;
  loop?: boolean;
}

export function Typewriter({ 
  text, 
  delay = 50, 
  deleteDelay = 30,
  pauseTime = 2000,
  className = "",
  loop = true
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(pauseTimeout);
    }

    if (!isDeleting && currentIndex < text.length) {
      // Typing forward
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && currentIndex === text.length && loop) {
      // Finished typing, pause before deleting
      setIsPaused(true);
    } else if (isDeleting && displayedText.length > 0) {
      // Deleting backward
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev.slice(0, -1));
      }, deleteDelay);
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayedText.length === 0 && loop) {
      // Finished deleting, restart
      setIsDeleting(false);
      setCurrentIndex(0);
    }
  }, [currentIndex, displayedText, isDeleting, isPaused, text, delay, deleteDelay, pauseTime, loop]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
