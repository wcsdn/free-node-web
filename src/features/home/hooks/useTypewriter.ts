/**
 * 打字机动画 Hook
 */
import { useState, useEffect, useCallback } from 'react';

interface UseTypewriterOptions {
  lines: string[];
  typingSpeed?: number;
  lineDelay?: number;
  onComplete?: () => void;
}

interface UseTypewriterReturn {
  displayedText: string;
  isComplete: boolean;
  reset: () => void;
}

export const useTypewriter = ({
  lines,
  typingSpeed = 50,
  lineDelay = 500,
  onComplete,
}: UseTypewriterOptions): UseTypewriterReturn => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const reset = useCallback(() => {
    setDisplayedText('');
    setCurrentLine(0);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (currentLine < lines.length) {
      const line = lines[currentLine];
      let charIndex = 0;

      const typeInterval = setInterval(() => {
        if (charIndex < line.length) {
          setDisplayedText(() => {
            const previousLines = lines.slice(0, currentLine).join('\n');
            return previousLines + (previousLines ? '\n' : '') + line.substring(0, charIndex + 1);
          });
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setCurrentLine((prev) => prev + 1);
          }, lineDelay);
        }
      }, typingSpeed);

      return () => clearInterval(typeInterval);
    } else if (currentLine === lines.length && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentLine, lines, typingSpeed, lineDelay, onComplete, isComplete]);

  return { displayedText, isComplete, reset };
};
