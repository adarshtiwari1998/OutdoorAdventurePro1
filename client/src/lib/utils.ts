
// Add scroll direction detection
let lastScrollY = 0;

export function handleHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  const currentScrollY = window.scrollY;
  
  if (currentScrollY > lastScrollY) {
    // Scrolling down
    header.style.transform = 'translateY(-100%)';
  } else {
    // Scrolling up
    header.style.transform = 'translateY(0)';
  }
  
  lastScrollY = currentScrollY;
}

// Add scroll event listener
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', handleHeaderScroll);
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
