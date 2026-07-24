import { useState, useEffect } from "react";

interface AvatarProps {
  photoUrl: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name: string): string {
  // Consistent monochrome/grayscale colors from name
  const colors = [
    "#000000", // Ink Black
    "#1a1a1a", // Charcoal
    "#282828", // Black Elevated
    "#4b4b4b", // Hairline Mid
    "#5e5e5e", // Body Gray
  ];
  const index = (name || "").charCodeAt(0) % colors.length;
  return colors[index];
}

export default function Avatar({
  photoUrl,
  name,
  size = 40,
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  useEffect(() => {
    let clean = photoUrl;
    if (clean) {
      if (clean.startsWith('//')) {
        clean = 'https:' + clean;
      } else if (clean.startsWith('http://')) {
        clean = clean.replace('http://', 'https://');
      }
    }
    setCurrentSrc(clean || null);
    setImgError(false);
  }, [photoUrl]);

  const handleImgError = () => {
    // If remote HTTP photo fails to load (e.g. expired CloudFront signature), try proxy fallback before initials
    if (currentSrc && (currentSrc.startsWith("http://") || currentSrc.startsWith("https://")) && !currentSrc.includes("/api/proxy-avatar")) {
      setCurrentSrc(`/api/proxy-avatar?url=${encodeURIComponent(currentSrc)}`);
    } else {
      setImgError(true);
    }
  };

  if (currentSrc && !imgError) {
    return (
      <img
        src={currentSrc}
        alt={name}
        className={`rounded-full shrink-0 object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={handleImgError}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Initials fallback
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-black text-white border border-[var(--border-base)] ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: getAvatarColor(name || ""),
        fontSize: size * 0.35,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
