import React, { useState, useEffect } from 'react';
import './App.css';
import MatrixRain from './MatrixRain';
import NewsTerminal from './components/NewsTerminal';
import CyberRabbit from './components/CyberRabbit';

const LINES = [
  '> Wake up, Neo...',
  '> The Matrix has you...',
  '> Follow the white rabbit.'
];

const App: React.FC = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    if (currentLine < LINES.length) {
      const line = LINES[currentLine];
      let charIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (charIndex < line.length) {
          setDisplayedText(prev => {
            const currentLineText = LINES.slice(0, currentLine).join('\n');
            return currentLineText + (currentLineText ? '\n' : '') + line.substring(0, charIndex + 1);
          });
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setCurrentLine(prev => prev + 1);
          }, 500);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    } else if (currentLine === LINES.length) {
      const timer = setTimeout(() => {
        setShowButtons(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLine]);

  return (
    <div className="matrix-container">
      <MatrixRain fontSize={16} />
      <div className="crt-scanline"></div>
      <div className="crt-noise"></div>
      
      <div className="terminal-content">
        <div className="typewriter-text">
          {displayedText}
          <span className="cursor">_</span>
        </div>
        
        {showButtons && (
          <>
            <CyberRabbit />
            
            <div className="button-container">
              <button className="matrix-button">
                <span className="button-scanline"></span>
                [ 📂 PROJECT: NEURO-CAT ]
              </button>
              <button className="matrix-button">
                <span className="button-scanline"></span>
                [ 🐍 PROJECT: INFO-HUNTER ]
              </button>
              <button className="matrix-button">
                <span className="button-scanline"></span>
                [ 🔗 CONNECT WALLET ]
              </button>
            </div>
            
            <div className="news-section">
              <NewsTerminal />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

