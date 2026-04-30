// Theme Toggle System
(function() {
    const THEME_KEY = 'theme-preference';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';
    
    // Get system preference
    const getSystemTheme = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
    };
    
    // Get saved preference or use system preference
    const getSavedTheme = () => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;
        return getSystemTheme();
    };
    
    // Apply theme to document
    const applyTheme = (theme) => {
        if (theme === DARK_THEME) {
            document.documentElement.setAttribute('data-theme', DARK_THEME);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem(THEME_KEY, theme);
        updateToggleButton(theme);
    };
    
    // Update toggle button appearance
    const updateToggleButton = (theme) => {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        
        if (theme === DARK_THEME) {
            toggle.innerHTML = '☀️';
            toggle.setAttribute('aria-label', 'Switch to light theme');
            toggle.title = 'Light Theme';
        } else {
            toggle.innerHTML = '🌙';
            toggle.setAttribute('aria-label', 'Switch to dark theme');
            toggle.title = 'Dark Theme';
        }
    };
    
    // Initialize theme
    const initTheme = () => {
        const theme = getSavedTheme();
        applyTheme(theme);
    };
    
    // Create and add theme toggle button
    const createToggleButton = () => {
        // Check if button already exists
        if (document.getElementById('theme-toggle')) return;
        
        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.className = 'theme-toggle-btn';
        toggle.setAttribute('aria-label', 'Toggle theme');
        
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === DARK_THEME ? LIGHT_THEME : DARK_THEME;
            applyTheme(newTheme);
        });
        
        return toggle;
    };
    
    // Add toggle button to header
    const addToggleToPage = () => {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addToggleToPage);
            return;
        }
        
        // Try to find header
        const header = document.querySelector('header');
        if (!header) return;
        
        // Check if toggle already exists
        if (document.getElementById('theme-toggle')) return;
        
        const toggle = createToggleButton();
        
        // Add to header with styling
        const headerStyle = document.createElement('style');
        headerStyle.textContent = `
            .theme-toggle-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--accent);
                color: white;
                border: none;
                border-radius: 50%;
                width: 44px;
                height: 44px;
                font-size: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                transition: all 0.3s ease;
                box-shadow: var(--shadow);
            }
            
            .theme-toggle-btn:hover {
                background: var(--accent-hover);
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
            }
            
            .theme-toggle-btn:active {
                transform: scale(0.95);
            }
            
            @media (max-width: 768px) {
                .theme-toggle-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                    top: 16px;
                    right: 16px;
                }
            }
            
            @media (max-width: 480px) {
                .theme-toggle-btn {
                    width: 38px;
                    height: 38px;
                    font-size: 18px;
                    top: 12px;
                    right: 12px;
                }
            }
        `;
        document.head.appendChild(headerStyle);
        document.body.appendChild(toggle);
        updateToggleButton(getSavedTheme());
    };
    
    // Listen for system theme changes
    const watchSystemTheme = () => {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only apply if user hasn't set a preference
            if (!localStorage.getItem(THEME_KEY)) {
                applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
            }
        });
    };
    
    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTheme();
            addToggleToPage();
            watchSystemTheme();
        });
    } else {
        initTheme();
        addToggleToPage();
        watchSystemTheme();
    }
    
    // Expose API for manual control
    window.themeManager = {
        setTheme: applyTheme,
        getTheme: () => localStorage.getItem(THEME_KEY) || getSystemTheme(),
        toggleTheme: () => {
            const current = localStorage.getItem(THEME_KEY) || getSystemTheme();
            applyTheme(current === DARK_THEME ? LIGHT_THEME : DARK_THEME);
        }
    };
})();
