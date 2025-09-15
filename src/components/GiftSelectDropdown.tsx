import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import regalosData from '../../regalos.json';

interface GiftOption {
  id: string;
  name: string;
  coins: number;
  image: string;
  index: number;
}

interface GiftSelectDropdownProps {
  value: number | string;
  onChange: (value: number | string) => void;
  className?: string;
}

const GiftSelectDropdown: React.FC<GiftSelectDropdownProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert TikTok gifts data to our format
  const regularGifts: GiftOption[] = regalosData.gifts.map((gift: any) => ({
    id: gift.id.replace('gift_', ''),
    name: gift.name,
    coins: parseInt(gift.price),
    image: gift.image,
    index: gift.index
  }));

  // Add special options (Likes and Follows) at the beginning
  const specialOptions: GiftOption[] = [
    {
      id: 'likes',
      name: 'Likes',
      coins: 0,
      image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">❤️</text></svg>',
      index: -2
    },
    {
      id: 'follows',
      name: 'Follows',
      coins: 0,
      image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">👥</text></svg>',
      index: -1
    }
  ];

  // Combine special options with regular gifts
  const gifts: GiftOption[] = [...specialOptions, ...regularGifts];

  // Debug logs
  console.log('=== DROPDOWN DEBUG ===');
  console.log('Total gifts loaded:', gifts.length);
  console.log('First 3 gifts:', gifts.slice(0, 3));
  console.log('Search term:', searchTerm);

  // Filter gifts based on search term
  const filteredGifts = searchTerm
    ? gifts.filter(gift =>
        gift.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : gifts; // Show all gifts when no search term

  console.log('Filtered gifts count:', filteredGifts.length);
  console.log('First 3 filtered gifts:', filteredGifts.slice(0, 3));

  // Get currently selected gift
  const selectedGift = gifts.find(gift => {
    // Handle special cases (likes, follows)
    if (typeof value === 'string') {
      return gift.id === value;
    }
    // Handle regular numeric IDs
    return gift.id === value.toString();
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectGift = (gift: GiftOption) => {
    console.log('Selected gift:', gift);
    // Handle special cases (likes, follows) that have string IDs
    if (gift.id === 'likes' || gift.id === 'follows') {
      onChange(gift.id as any); // Pass the string ID directly
    } else {
      onChange(parseInt(gift.id)); // Convert to number for regular gifts
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className={`gift-select-dropdown ${className}`} style={{ position: 'relative' }}>
      {/* Selected Gift Display */}
      <button
        type="button"
        onClick={() => {
          console.log('Dropdown button clicked! Current state:', isOpen);
          if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + 8,
              left: rect.left,
              width: rect.width
            });
          }
          setIsOpen(!isOpen);
        }}
        className="selected-gift-button"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #374151',
          borderRadius: '8px',
          backgroundColor: '#1f2937',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <div className="selected-gift-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedGift ? (
            <>
              <img 
                src={selectedGift.image} 
                alt={selectedGift.name}
                className="gift-image"
                style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><text y="18" font-size="16">🎁</text></svg>';
                }}
              />
              <div className="gift-info">
                <span className="gift-name">{selectedGift.name}</span>
                <span className="gift-price" style={{ fontSize: '12px', opacity: 0.7 }}>
                  ({selectedGift.coins === 0 ? 'Gratis' : `${selectedGift.coins} coins`})
                </span>
              </div>
            </>
          ) : (
            <span className="placeholder" style={{ opacity: 0.7 }}>Select a gift...</span>
          )}
        </div>
        <ChevronDown 
          size={20} 
          className={`chevron ${isOpen ? 'open' : ''}`}
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="dropdown-menu"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${Math.max(dropdownPosition.width, 300)}px`,
              zIndex: 99999,
              backgroundColor: '#1f2937',
              border: '2px solid #374151',
              borderRadius: '12px',
              maxHeight: '400px',
              minHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, type: "spring" }}
          >
            {/* Search Input */}
            <div className="search-container" style={{ padding: '12px', borderBottom: '1px solid #374151' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '8px', color: '#9CA3AF' }} />
                <input
                  type="text"
                  placeholder="Search gifts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 32px',
                    backgroundColor: '#374151',
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Gift Options */}
            <div className="gift-options">
              <div style={{ 
                padding: '10px', 
                fontSize: '12px', 
                color: '#9CA3AF', 
                borderBottom: '1px solid #374151',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                📊 Showing {filteredGifts.length} of {gifts.length} gifts
              </div>
              
              {filteredGifts.slice(0, 50).map((gift, index) => (
                <button
                  key={`${gift.id}-${index}`}
                  type="button"
                  onClick={() => handleSelectGift(gift)}
                  style={{
                    width: '100%',
                    padding: '15px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    backgroundColor: selectedGift?.id === gift.id ? '#3B82F6' : 'transparent',
                    border: 'none',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #374151',
                    fontSize: '16px',
                    minHeight: '60px'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedGift?.id !== gift.id) {
                      (e.target as HTMLElement).style.backgroundColor = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedGift?.id !== gift.id) {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <img 
                    src={gift.image}
                    alt={gift.name}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="24" font-size="20">🎁</text></svg>';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{gift.name}</div>
                    <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                      {gift.coins === 0 ? 'Gratis' : `${gift.coins} coins`}
                    </div>
                  </div>
                  {gift.coins > 1000 && (
                    <div style={{
                      backgroundColor: '#F59E0B',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      Premium
                    </div>
                  )}
                </button>
              ))}
              
              {filteredGifts.length > 50 && (
                <div style={{ 
                  padding: '10px', 
                  textAlign: 'center', 
                  color: '#9CA3AF', 
                  fontSize: '12px',
                  borderTop: '1px solid #374151'
                }}>
                  Showing first 50 of {filteredGifts.length} results. Search to narrow down.
                </div>
              )}
              
              {filteredGifts.length === 0 && searchTerm && (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#9CA3AF', 
                  fontSize: '14px'
                }}>
                  No gifts found matching "{searchTerm}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GiftSelectDropdown;