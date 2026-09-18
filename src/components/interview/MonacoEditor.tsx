import Editor from '@monaco-editor/react';
import type { ILanguage } from '../../data/interview/types';

const LANGUAGE_TO_MONACO: Record<ILanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  sql: 'sql',
  cpp: 'cpp',
  java: 'java',
  python: 'python',
};

interface MonacoEditorProps {
  language: ILanguage;
  value: string;
  onChange: (v: string) => void;
  height?: number | string;
}

/** Monaco wrapper with app-consistent dark theming and sane interview defaults. */
export default function MonacoEditor({ language, value, onChange, height = 260 }: MonacoEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <Editor
        height={height}
        theme="vs-dark"
        language={LANGUAGE_TO_MONACO[language]}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        loading={
          <div className="flex h-full items-center justify-center bg-elevated/70 font-mono text-xs text-muted">
            loading editor…
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'none',
          automaticLayout: true,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}
