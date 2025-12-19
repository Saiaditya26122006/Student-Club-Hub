import React, { useEffect, useState } from 'react';

/**
 * Floating Context Dock - Adaptive Navigation Component
 * 
 * Displays all navigation options at the bottom center of the screen.
 * The current page is never shown in the dock.
 */
export default function FloatingContextDock({ activeTab, onNavigate, menuItems }) {
  const [mounted, setMounted] = useState(false);
  const [visibleItems, setVisibleItems] = useState([]);

  // Show all options (including current page)
  const contextualOptions = menuItems;

  // Animate items in with stagger effect
  useEffect(() => {
    setMounted(false);
    setVisibleItems([]);
    
    const timer1 = setTimeout(() => {
      setMounted(true);
    }, 50);

    const timer2 = setTimeout(() => {
      contextualOptions.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems(prev => [...prev, index]);
        }, index * 50);
      });
    }, 100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeTab, contextualOptions.length]);

  // Don't render if no options available
  if (contextualOptions.length === 0) {
    return null;
  }

  const handleNavigation = (itemId) => {
    onNavigate(itemId);
  };

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes dockSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 30px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .dock-container {
          animation: dockSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .dock-item {
          animation: slideUpFade 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        .dock-item.visible {
          opacity: 1;
        }

        .dock-item:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .dock-item:active {
          transform: translateY(0);
        }

        .dock-icon {
          transition: color 0.2s ease;
        }

        .dock-item:hover .dock-icon {
          color: #4f46e5;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 dock-container"
        role="navigation"
        aria-label="Context navigation dock"
      >
        <div 
          className="px-6 py-4 flex items-center gap-3 justify-center overflow-x-auto scrollbar-hide whitespace-nowrap relative"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            borderRadius: '1.5rem',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          }}
        >
          {contextualOptions.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`dock-item flex flex-col items-center justify-center gap-1 px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex-shrink-0 relative z-10 ${
                visibleItems.includes(index) ? 'visible' : ''
              }`}
              style={{ 
                animationDelay: `${index * 0.05}s`,
                borderRadius: '1rem',
                background: 'transparent',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                border: 'none',
                boxShadow: 'none',
              }}
              aria-label={item.label}
              title={item.label}
            >
              <div className="text-gray-700 flex items-center justify-center dock-icon relative z-10">
                <div className="w-5 h-5">
                  {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600 whitespace-nowrap transition-colors duration-200 relative z-10">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

