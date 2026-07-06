import { useState } from "react";

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
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function Avatar({
  photoUrl,
  name,
  size = 40,
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  let cleanPhotoUrl = photoUrl;
  if (cleanPhotoUrl) {
    if (cleanPhotoUrl.startsWith('//')) {
      cleanPhotoUrl = 'https:' + cleanPhotoUrl;
    } else if (cleanPhotoUrl.startsWith('http://')) {
      cleanPhotoUrl = cleanPhotoUrl.replace('http://', 'https://');
    }
  }

  if (cleanPhotoUrl && !imgError) {
    return (
      <img
        src={cleanPhotoUrl}
        alt={name}
        className={`rounded-full shrink-0 object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)} // fallback on error (e.g. expired expired CloudFront CDN link)
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
