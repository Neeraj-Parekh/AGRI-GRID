import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

/**
 * Image slot. Drop a file at frontend/public/media/<name> and it appears; until then a labelled
 * placeholder shows exactly which file to add.
 */
export default function Photo({ name, alt, ratio = '4 / 3', caption, className = '' }) {
  const [ok, setOk] = useState(true);
  const src = `${import.meta.env.BASE_URL}media/${name}`;
  return (
    <figure className={`ag-photo ${className}`} style={{ aspectRatio: ratio }}>
      {ok ? <img src={src} alt={alt} loading="lazy" onError={() => setOk(false)} />
        : <div className="ag-photo-ph" role="img" aria-label={`Placeholder: ${alt}`}><ImageIcon size={28} /><b>{alt}</b><code>public/media/{name}</code></div>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
