import { ExternalLink, PlayCircle, FileText } from 'lucide-react';
import Modal from './ui/Modal';
import type { PopupContent, PopupTopicItem } from '../data/learningResources';
import ImportanceBadge from './ui/ImportanceBadge';

interface ImportantPopupProps {
  open: boolean;
  onClose: () => void;
  content: PopupContent;
}

function PopupTopicRow({ item }: { item: PopupTopicItem }) {
  return (
    <li className="glass rounded-xl p-4">
      <p className="font-semibold">{item.title}</p>
      <p className="mt-0.5 text-sm text-muted">{item.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.notes?.available ? (
          <a
            href={item.notes.link?.url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-secondary !py-1.5 !text-xs"
          >
            <FileText size={13} /> Read Notes <ExternalLink size={11} className="opacity-60" />
          </a>
        ) : (
          <span className="badge border-line text-muted">Notes — coming soon</span>
        )}
        {item.lectures?.available ? (
          <a
            href={item.lectures.link?.url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-secondary !py-1.5 !text-xs"
          >
            <PlayCircle size={13} /> Watch Lectures <ExternalLink size={11} className="opacity-60" />
          </a>
        ) : (
          <span className="badge border-line text-muted">Lectures — coming soon</span>
        )}
      </div>
    </li>
  );
}

export default function ImportantPopup({ open, onClose, content }: ImportantPopupProps) {
  return (
    <Modal open={open} onClose={onClose} title={content.title} subtitle={content.why} size="xl">
      <div className="mb-5 flex items-center gap-3">
        <ImportanceBadge level={content.badge === 'VERY IMPORTANT' ? 'very-important' : 'important'} size="md" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {content.topics.length} focus areas
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {content.topics.map((item) => (
          <PopupTopicRow key={item.title} item={item} />
        ))}
      </ul>
    </Modal>
  );
}
