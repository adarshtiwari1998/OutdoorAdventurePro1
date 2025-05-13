import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-neutral-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">About Us</h3>
            <p className="text-neutral mb-4">
              Dedicated to helping you discover and enjoy outdoor adventures with expert guidance, quality gear, and a passionate community.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-secondary transition">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white hover:text-secondary transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-secondary transition">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-white hover:text-secondary transition">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Activities</h3>
            <ul className="space-y-2">
              <li><Link href="/outdoors" className="text-neutral hover:text-white transition">Outdoors</Link></li>
              <li><Link href="/cruising" className="text-neutral hover:text-white transition">Cruising</Link></li>
              <li><Link href="/fishing" className="text-neutral hover:text-white transition">Fishing</Link></li>
              <li><Link href="/hiking" className="text-neutral hover:text-white transition">Hiking</Link></li>
              <li><Link href="/camping" className="text-neutral hover:text-white transition">Camping</Link></li>
              <li><Link href="/4x4" className="text-neutral hover:text-white transition">4x4 Adventures</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/shop?category=camping" className="text-neutral hover:text-white transition">Camping Gear</Link></li>
              <li><Link href="/shop?category=hiking" className="text-neutral hover:text-white transition">Hiking Equipment</Link></li>
              <li><Link href="/shop?category=fishing" className="text-neutral hover:text-white transition">Fishing Supplies</Link></li>
              <li><Link href="/shop?category=cruising" className="text-neutral hover:text-white transition">Boat Accessories</Link></li>
              <li><Link href="/shop?category=4x4" className="text-neutral hover:text-white transition">4x4 Gear</Link></li>
              <li><Link href="/shop?category=clothing" className="text-neutral hover:text-white transition">Clothing & Apparel</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin className="mt-1 mr-3 flex-shrink-0" size={18} />
                <span>123 Adventure Way, Outdoor City, OC 12345</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-3 flex-shrink-0" size={18} />
                <span>(123) 456-7890</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-3 flex-shrink-0" size={18} />
                <span>info@outdooradventures.com</span>
              </li>
              <li className="flex items-center">
                <Clock className="mr-3 flex-shrink-0" size={18} />
                <span>Mon-Fri: 9am - 5pm</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-neutral">© {new Date().getFullYear()} OutdoorAdventures. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-sm text-neutral hover:text-white transition">Privacy Policy</a>
              <a href="#" className="text-sm text-neutral hover:text-white transition">Terms of Service</a>
              <a href="#" className="text-sm text-neutral hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
