// Custom SVG icons for landing page
function PrayerIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9963A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="2.5" />
      <path d="M7 12 Q7 10 12 10 Q17 10 17 12 L15 18 Q12 21 9 18 Z" />
      <path d="M12 18 L12 22" />
      <line x1="10" y1="22" x2="14" y2="22" strokeWidth="1.6" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9963A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5 Q9 3 4 4 L4 20 Q9 19 12 21 Q15 19 20 20 L20 4 Q15 3 12 5 Z"/>
      <line x1="12" y1="5" x2="12" y2="21"/>
      <line x1="7" y1="9" x2="10" y2="9" strokeWidth="1"/>
      <line x1="7" y1="12" x2="10" y2="12" strokeWidth="1"/>
      <line x1="7" y1="15" x2="10" y2="15" strokeWidth="1"/>
      <line x1="14" y1="9" x2="17" y2="9" strokeWidth="1"/>
      <line x1="14" y1="12" x2="17" y2="12" strokeWidth="1"/>
    </svg>
  );
}

function StreakIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9963A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20 L15 20"/>
      <line x1="12" y1="20" x2="12" y2="16"/>
      <ellipse cx="12" cy="14" rx="4" ry="2.5"/>
      <path d="M12 14 Q10 10 12 7 Q14 10 12 14"/>
      <path d="M12 11 Q11 9 12 8 Q13 9 12 11"/>
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9963A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 18 L8 7 Q8 4 12 4 Q16 4 16 7 L16 18"/>
      <line x1="8" y1="18" x2="16" y2="18"/>
      <line x1="10" y1="16" x2="10" y2="8"/>
      <line x1="12" y1="16" x2="12" y2="6"/>
      <line x1="14" y1="16" x2="14" y2="8"/>
    </svg>
  );
}

export default function LandingPage({ onEnter }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { margin: 0; overflow: hidden; }
        html, body { height: 100%; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>
      
      <div style={{
        height: '100dvh',
        width: '100%',
        background: 'linear-gradient(135deg, #130b04 0%, #1a0f08 50%, #0d0603 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '40px 24px',
        overflow: 'hidden',
        fontFamily: "'EB Garamond', Georgia, serif",
        position: 'relative',
      }}>
        
        {/* Gradient ornamentation in background */}
        <div style={{
          position: 'absolute',
          top: '-200px',
          right: '-150px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(201,150,58,0.12), transparent)',
          borderRadius: '50%',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-300px',
          left: '-200px',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(201,150,58,0.08), transparent)',
          borderRadius: '50%',
          zIndex: 0,
        }} />

        {/* Content wrapper */}
        <div style={{position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', textAlign: 'center', gap: '32px', maxWidth: '580px'}}>
          
          {/* Logo/Cross Icon */}
          <div style={{animation: 'float 4s ease-in-out infinite'}}>
            <svg width="56" height="72" viewBox="0 0 60 70" fill="none">
              <rect x="25" y="0" width="10" height="70" rx="2" fill="#C9963A" opacity="0.85"/>
              <rect x="0" y="18" width="60" height="10" rx="2" fill="#C9963A" opacity="0.85"/>
              <rect x="27" y="2" width="6" height="66" rx="1" fill="#C9963A" opacity="0.35"/>
              <rect x="2" y="20" width="56" height="6" rx="1" fill="#C9963A" opacity="0.35"/>
            </svg>
          </div>

          {/* Main Title */}
          <div>
            <h1 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '3rem',
              fontWeight: 700,
              color: '#C9963A',
              margin: '0 0 12px 0',
              letterSpacing: '0.08em',
              lineHeight: 1.2,
              animation: 'fadeInUp 0.8s ease forwards',
            }}>
              My Prayer Book
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#a8906e',
              fontStyle: 'italic',
              margin: 0,
              letterSpacing: '0.05em',
              animation: 'fadeInUp 0.8s ease forwards 0.1s both',
            }}>
              Scripture-Based Prayers for Your Soul
            </p>
          </div>

          {/* Description */}
          <p style={{
            fontSize: '1.05rem',
            color: '#d4c4a8',
            lineHeight: 1.8,
            margin: '0',
            maxWidth: '480px',
            animation: 'fadeInUp 0.8s ease forwards 0.2s both',
          }}>
            Come before God with a sincere heart. Generate personalized prayers grounded in Scripture, journal your spiritual journey, master Bible verses, and build a consistent prayer practice.
          </p>

          {/* Feature badges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            width: '100%',
            animation: 'fadeInUp 0.8s ease forwards 0.3s both',
          }}>
            {[
              { Icon: PrayerIcon, label: 'Prayers', desc: 'Grounded in Scripture' },
              { Icon: JournalIcon, label: 'Journal', desc: 'Track your journey' },
              { Icon: StreakIcon, label: 'Streak', desc: 'Build consistency' },
              { Icon: MusicIcon, label: 'Music', desc: 'Classical ambiance' },
            ].map((feature, idx) => (
              <div key={idx} style={{
                background: 'rgba(201, 150, 58, 0.08)',
                border: '1px solid rgba(201, 150, 58, 0.2)',
                borderRadius: '12px',
                padding: '16px 12px',
                textAlign: 'center',
              }}>
                <div style={{marginBottom: '8px', display: 'flex', justifyContent: 'center'}}>
                  <feature.Icon />
                </div>
                <div style={{fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: '#C9963A', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '2px'}}>
                  {feature.label}
                </div>
                <div style={{fontSize: '0.7rem', color: '#6b5535', fontStyle: 'italic'}}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onEnter}
            style={{
              marginTop: '16px',
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #8B6914, #C9963A, #8B6914)',
              backgroundSize: '200%',
              border: 'none',
              borderRadius: '12px',
              color: '#1a0f07',
              fontFamily: "'Cinzel', serif",
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(201, 150, 58, 0.3)',
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              animation: 'fadeInUp 0.8s ease forwards 0.4s both',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(201, 150, 58, 0.4)',
              },
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 40px rgba(201, 150, 58, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 8px 32px rgba(201, 150, 58, 0.3)';
            }}
          >
            Begin Your Prayer Journey
          </button>
        </div>

        {/* Footer message */}
        <div style={{
          fontSize: '0.85rem',
          color: '#3a2810',
          fontStyle: 'italic',
          textAlign: 'center',
          animation: 'fadeInUp 0.8s ease forwards 0.5s both',
          position: 'relative',
          zIndex: 1,
        }}>
          <p style={{margin: 0}}>Come before God with a sincere heart.</p>
          <p style={{margin: '4px 0 0 0', fontSize: '0.75rem', color: '#2a1810', opacity: 0.7}}>
            Powered by AI & Scripture
          </p>
        </div>
      </div>
    </>
  );
}
