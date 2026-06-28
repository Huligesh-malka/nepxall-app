// BoyWalking.jsx
import { alpha } from "@mui/material";

const BRAND = {
  accent: "#63F4A3",
};

export const BoyWalking = ({ style }) => (
  <svg style={style} viewBox="0 0 120 170">
    <g>
      {/* Shadow */}
      <ellipse cx="60" cy="155" rx="30" ry="7" fill={alpha("#000", 0.25)}>
        <animate attributeName="rx" values="30;26;30" dur="0.6s" repeatCount="indefinite" />
      </ellipse>

      {/* Backpack */}
      <g transform="translate(30, 50)">
        <rect x="0" y="0" width="10" height="35" rx="4" fill="#2C3E50" opacity="0.7" />
        <rect x="-2" y="5" width="14" height="25" rx="3" fill="#34495E" opacity="0.5" />
        <path d="M10,8 L16,20" stroke="#2C3E50" strokeWidth="3" fill="none" />
        <path d="M0,8 L-6,20" stroke="#2C3E50" strokeWidth="3" fill="none" />
      </g>

      {/* Trolley Bag */}
      <g transform="translate(88, 98)">
        <line x1="8" y1="0" x2="8" y2="-42" stroke={alpha("#8A8FA3", 0.6)} strokeWidth="4" strokeLinecap="round" />
        <line x1="8" y1="-42" x2="-18" y2="-42" stroke={alpha("#8A8FA3", 0.6)} strokeWidth="4" strokeLinecap="round" />
        <line x1="-18" y1="-42" x2="-18" y2="-22" stroke={alpha("#8A8FA3", 0.6)} strokeWidth="4" strokeLinecap="round" />
        <rect x="-18" y="8" width="42" height="52" rx="8" fill="#4A90D9" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="2" />
        <rect x="-15" y="12" width="10" height="10" rx="3" fill={alpha(BRAND.accent, 0.08)} />
        <rect x="0" y="12" width="10" height="10" rx="3" fill={alpha(BRAND.accent, 0.08)} />
        <rect x="-15" y="27" width="10" height="10" rx="3" fill={alpha(BRAND.accent, 0.08)} />
        <rect x="0" y="27" width="10" height="10" rx="3" fill={alpha(BRAND.accent, 0.08)} />
        <rect x="-15" y="42" width="10" height="10" rx="3" fill={alpha(BRAND.accent, 0.08)} />
        <rect x="0" y="42" width="10" height="10" rx="3" fill={alpha(BRAND.accent, 0.08)} />
        <g transform="translate(-8, 60)">
          <circle cx="0" cy="0" r="8" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="2" />
          <circle cx="0" cy="0" r="3.5" fill="#3A5A6A" />
          <line x1="0" y1="-7" x2="0" y2="7" stroke="#3A5A6A" strokeWidth="1.5">
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.5s" repeatCount="indefinite" />
          </line>
        </g>
        <g transform="translate(18, 60)">
          <circle cx="0" cy="0" r="8" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="2" />
          <circle cx="0" cy="0" r="3.5" fill="#3A5A6A" />
          <line x1="0" y1="-7" x2="0" y2="7" stroke="#3A5A6A" strokeWidth="1.5">
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.5s" repeatCount="indefinite" />
          </line>
        </g>
      </g>

      {/* Character Body */}
      <g>
        {/* Hoodie/Jacket */}
        <rect x="32" y="48" width="48" height="62" rx="12" fill="#2D6A4F" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1.5" />
        <line x1="56" y1="48" x2="56" y2="110" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="2" />
        <rect x="37" y="75" width="16" height="14" rx="4" fill="none" stroke={alpha(BRAND.accent, 0.12)} strokeWidth="1.5" />
        <rect x="59" y="75" width="16" height="14" rx="4" fill="none" stroke={alpha(BRAND.accent, 0.12)} strokeWidth="1.5" />
        <path d="M32,48 Q40,40 56,44 Q72,40 80,48" fill="#1A4A3A" stroke={alpha(BRAND.accent, 0.08)} strokeWidth="1" />
        <path d="M32,48 Q56,26 80,48" fill="#2D6A4F" stroke={alpha(BRAND.accent, 0.08)} strokeWidth="1" />
        <line x1="50" y1="44" x2="46" y2="55" stroke="#1A4A3A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="62" y1="44" x2="66" y2="55" stroke="#1A4A3A" strokeWidth="1.5" strokeLinecap="round" />

        {/* Legs */}
        <rect x="35" y="110" width="16" height="34" rx="4" fill="#1A3A5A">
          <animate attributeName="x" values="35;42;35" dur="0.6s" repeatCount="indefinite" />
        </rect>
        <rect x="61" y="110" width="16" height="34" rx="4" fill="#1A3A5A">
          <animate attributeName="x" values="61;54;61" dur="0.6s" repeatCount="indefinite" />
        </rect>

        {/* Shoes */}
        <ellipse cx="41" cy="146" rx="13" ry="6" fill="#FFFFFF" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1.5">
          <animate attributeName="cx" values="41;47;41" dur="0.6s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="67" cy="146" rx="13" ry="6" fill="#FFFFFF" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1.5">
          <animate attributeName="cx" values="67;61;67" dur="0.6s" repeatCount="indefinite" />
        </ellipse>
        <path d="M34,146 L48,146" stroke={alpha("#000", 0.1)} strokeWidth="1" />
        <path d="M60,146 L74,146" stroke={alpha("#000", 0.1)} strokeWidth="1" />

        {/* Arms */}
        <line x1="32" y1="58" x2="22" y2="92" stroke="#2D6A4F" strokeWidth="10" strokeLinecap="round" />
        <circle cx="22" cy="94" r="7" fill="#C68642" />
        <line x1="80" y1="58" x2="94" y2="84" stroke="#2D6A4F" strokeWidth="10" strokeLinecap="round">
          <animate attributeName="x2" values="94;98;94" dur="0.6s" repeatCount="indefinite" />
          <animate attributeName="y2" values="84;80;84" dur="0.6s" repeatCount="indefinite" />
        </line>
        <circle cx="94" cy="86" r="7" fill="#C68642">
          <animate attributeName="cx" values="94;98;94" dur="0.6s" repeatCount="indefinite" />
          <animate attributeName="cy" values="86;82;86" dur="0.6s" repeatCount="indefinite" />
        </circle>

        {/* Head - Indian features */}
        <ellipse cx="56" cy="36" rx="26" ry="30" fill="#C68642" stroke={alpha(BRAND.accent, 0.05)} strokeWidth="1" />
        <ellipse cx="56" cy="24" rx="28" ry="20" fill="#1A1A1A" />
        <path d="M28,26 Q42,14 56,16 Q70,14 84,26" fill="#1A1A1A" />
        <path d="M32,22 Q40,14 48,18 Q56,12 64,18 Q72,14 80,22" stroke={alpha("#2A2A2A", 0.4)} strokeWidth="2" fill="none" />
        <path d="M28,26 Q26,34 30,40" stroke="#1A1A1A" strokeWidth="3" fill="none" />
        <path d="M84,26 Q86,34 82,40" stroke="#1A1A1A" strokeWidth="3" fill="none" />

        {/* Eyebrows */}
        <path d="M40,30 Q46,27 52,30" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M60,30 Q66,27 72,30" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Eyes */}
        <ellipse cx="45" cy="37" rx="6" ry="6.5" fill="#FFFFFF" />
        <ellipse cx="67" cy="37" rx="6" ry="6.5" fill="#FFFFFF" />
        <circle cx="46" cy="37" r="4" fill="#2C1810" />
        <circle cx="68" cy="37" r="4" fill="#2C1810" />
        <circle cx="47" cy="35.5" r="1.8" fill="#FFFFFF" />
        <circle cx="69" cy="35.5" r="1.8" fill="#FFFFFF" />
        <circle cx="45" cy="38.5" r="1" fill="#FFFFFF" opacity="0.6" />
        <circle cx="67" cy="38.5" r="1" fill="#FFFFFF" opacity="0.6" />

        {/* Nose */}
        <path d="M55,36 L53,44 Q56,47 59,44 L57,36" fill="none" stroke={alpha("#8B5E3C", 0.4)} strokeWidth="1.5" />

        {/* Smile */}
        <path d="M46,48 Q56,57 66,48" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M48,49 Q56,53 64,49" fill="#FFFFFF" opacity="0.3" />
        <circle cx="43" cy="49" r="2" fill={alpha("#8B5E3C", 0.15)} />
        <circle cx="69" cy="49" r="2" fill={alpha("#8B5E3C", 0.15)} />
        <ellipse cx="56" cy="54" rx="8" ry="3" fill={alpha("#8B5E3C", 0.1)} />
        <path d="M48,52 Q56,54 64,52" stroke={alpha("#8B5E3C", 0.08)} strokeWidth="1" fill="none" />
      </g>
    </g>
  </svg>
);