import { useMemo } from 'react';
import regalosData from '../../regalos.json';

interface GiftInfo {
  id: string;
  name: string;
  coins: number;
  image: string;
  index: number;
}

export const useGiftData = () => {
  const giftMap = useMemo(() => {
    // Convert TikTok gifts data to our format
    const regularGifts: { [key: string]: GiftInfo } = regalosData.gifts.reduce((acc: any, gift: any) => {
      acc[gift.id.replace('gift_', '')] = {
        id: gift.id.replace('gift_', ''),
        name: gift.name,
        coins: parseInt(gift.price),
        image: gift.image,
        index: gift.index
      };
      return acc;
    }, {});

    // Add special options (Likes and Follows)
    const specialOptions: { [key: string]: GiftInfo } = {
      'likes': {
        id: 'likes',
        name: 'Likes',
        coins: 0,
        image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">❤️</text></svg>',
        index: -2
      },
      'follows': {
        id: 'follows',
        name: 'Follows',
        coins: 0,
        image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">👥</text></svg>',
        index: -1
      },
      'shares': {
        id: 'shares',
        name: 'Shares',
        coins: 0,
        image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">📤</text></svg>',
        index: -3
      }
    };

    // Combine both maps
    return { ...specialOptions, ...regularGifts };
  }, []);

  const getGiftInfo = (giftId: string | number): GiftInfo | null => {
    const key = giftId.toString();
    return giftMap[key] || null;
  };

  const getGiftImage = (giftId: string | number): string => {
    const giftInfo = getGiftInfo(giftId);
    return giftInfo?.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">🎁</text></svg>';
  };

  const getGiftName = (giftId: string | number): string => {
    const giftInfo = getGiftInfo(giftId);
    return giftInfo?.name || `Regalo ${giftId}`;
  };

  const getGiftCoins = (giftId: string | number): number => {
    const giftInfo = getGiftInfo(giftId);
    return giftInfo?.coins || 0;
  };

  return {
    giftMap,
    getGiftInfo,
    getGiftImage,
    getGiftName,
    getGiftCoins
  };
};