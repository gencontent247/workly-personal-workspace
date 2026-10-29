import {useEffect, useRef} from 'react';
import type {InputHTMLAttributes} from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'onInput'> & {
  value: string;
  onChange: (value: string) => void;
  onEnter?: (value: string) => void;
  live?: boolean;
};

/** UniKey edits the native input directly, including synthetic Backspace events. */
export default function NativeInput({value, onChange, onEnter, live = false, ...props}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const latest = useRef(value);
  const composing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (element && value !== latest.current && !composing.current) {
      element.value = value;
      latest.current = value;
    }
  }, [value]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const commit = () => {
    if (timer.current) clearTimeout(timer.current);
    const text = ref.current?.value;
    if (text !== undefined) { latest.current = text; onChange(text); }
  };

  return <input {...props} ref={ref} defaultValue={value} spellCheck={false}
    onInput={() => {
      latest.current = ref.current?.value ?? '';
      if (live && !composing.current) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(commit, 350);
      }
    }}
    onCompositionStart={() => { composing.current = true; }}
    onCompositionEnd={() => { composing.current = false; if (live) commit(); }}
    onBlur={commit}
    onKeyDown={event => {
      if (event.key === 'Enter' && !composing.current && !event.nativeEvent.isComposing && event.keyCode !== 229) {
        commit();
        onEnter?.(ref.current?.value ?? '');
      }
    }} />;
}
