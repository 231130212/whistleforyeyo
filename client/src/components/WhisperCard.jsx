import { OWNER_NAME } from '../config.js';
import { fullDate, timeAgo } from '../time.js';
import SongCard from './SongCard.jsx';

export default function WhisperCard({ message, children, highlight = false }) {
  return (
    <article className={`card whisper ${highlight ? 'is-unread' : ''}`}>
      <header className="whisper-head">
        <span className="whisper-from">{message.name || 'Anonim'}</span>
        <time dateTime={message.createdAt} title={fullDate(message.createdAt)}>
          {timeAgo(message.createdAt)}
        </time>
      </header>

      <p className="whisper-body">{message.body}</p>

      {message.song && <SongCard song={message.song} />}

      {message.reply && (
        <div className="reply">
          <span className="reply-label">Balasan {OWNER_NAME}</span>
          <p>{message.reply}</p>
        </div>
      )}

      {children}
    </article>
  );
}
