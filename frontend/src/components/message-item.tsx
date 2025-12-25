'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ChatUIMessage } from '@/lib/types';
import { motion } from 'framer-motion';

interface MessageItemProps {
  message: ChatUIMessage;
}

interface MaskRange {
  start: number;
  end: number;
  type: 'email' | 'phone' | 'name';
}

export function MessageItem({ message }: MessageItemProps) {
  const [revealedMasks, setRevealedMasks] = useState<Set<string>>(new Set());

  // Extract text content from message parts
  const textContent = useMemo(() => {
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');
  }, [message.parts]);

  // Extract PII masks from message parts - use the latest one as it contains the most complete scan
  const piiMasks = useMemo(() => {
    // Search from the end to find the most recent mask data
    let masks: MaskRange[] = [];
    for (let i = message.parts.length - 1; i >= 0; i--) {
      const part = message.parts[i];
      if (part.type === 'data-pii-mask' && 'data' in part && part.data) {
        masks = (part.data as { masks: MaskRange[] }).masks || [];
        break;
      }
    }

    // Clean up masks: sort and handle overlaps
    return [...masks]
      .sort((a, b) => a.start - b.start)
      .reduce((acc, current) => {
        if (acc.length === 0) return [current];
        const last = acc[acc.length - 1];
        
        // If current mask starts before the last one ends, they overlap
        if (current.start < last.end) {
          // Merge them (keep the end that is furthest)
          last.end = Math.max(last.end, current.end);
          return acc;
        }
        
        acc.push(current);
        return acc;
      }, [] as MaskRange[]);
  }, [message.parts]);

  // Toggle mask visibility
  const toggleMask = (index: number) => {
    const maskKey = `${index}`;
    setRevealedMasks((prev) => {
      const next = new Set(prev);
      if (next.has(maskKey)) {
        next.delete(maskKey);
      } else {
        next.add(maskKey);
      }
      return next;
    });
  };

  // Render text with PII masking
  const renderContent = () => {
    if (!textContent) return null;
    if (piiMasks.length === 0) {
      return <span>{textContent}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    piiMasks.forEach((mask, index) => {
      // Add text before mask
      if (mask.start > lastIndex) {
        segments.push(
          <span key={`text-${index}`}>{textContent.slice(lastIndex, mask.start)}</span>
        );
      }

      // Add the masked/blur segment
      const actualStart = Math.max(mask.start, lastIndex);
      if (mask.end > actualStart) {
        const maskedText = textContent.slice(actualStart, mask.end);
        const isRevealed = revealedMasks.has(`${index}`);

        segments.push(
          <motion.span
            key={`mask-${index}`}
            onClick={() => toggleMask(index)}
            initial={false}
            animate={{
              filter: isRevealed ? 'blur(0px)' : 'blur(4px)',
              backgroundColor: isRevealed ? 'rgba(234, 179, 8, 0.2)' : 'rgba(75, 85, 99, 1)',
              color: isRevealed ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)',
            }}
            whileHover={{
              filter: isRevealed ? 'blur(0px)' : 'blur(6px)',
            }}
            className={cn(
              'mx-0.5 inline-block cursor-pointer rounded px-1 transition-all duration-200 select-none'
            )}
            title={isRevealed ? 'Click to hide' : 'Click to reveal'}
          >
            {maskedText}
          </motion.span>
        );
      }

      lastIndex = Math.max(lastIndex, mask.end);
    });

    // Add remaining text
    if (lastIndex < textContent.length) {
      segments.push(
        <span key="text-end">{textContent.slice(lastIndex)}</span>
      );
    }

    return <>{segments}</>;
  };

  return (
    <div
      className={cn(
        'flex',
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap',
          message.role === 'user'
            ? 'bg-white text-black'
            : 'border border-white/10 bg-white/5 text-white'
        )}
      >
        {renderContent()}
      </div>
    </div>
  );
}
