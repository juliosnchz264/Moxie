"use client";

import {
  useEffect,
  useRef,
  type ElementType,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

interface Props {
  value: string;
  placeholder: string;
  editing: boolean;
  onChange: (value: string) => void;
  as?: ElementType;
  className?: string;
  multiline?: boolean;
  autoFocus?: boolean;
}

export function InlineText({
  value,
  placeholder,
  editing,
  onChange,
  as: Tag = "span",
  className = "",
  multiline = false,
  autoFocus = false,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.textContent !== value) {
      el.textContent = value;
    }
  }, [value, editing]);

  useEffect(() => {
    if (!editing || !autoFocus) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }, [editing, autoFocus]);

  if (!editing) {
    const showPlaceholder = !value;
    return (
      <Tag
        className={`${className} ${
          showPlaceholder ? "text-slate-400 italic" : ""
        }`.trim()}
      >
        {showPlaceholder ? placeholder : value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      role="textbox"
      aria-multiline={multiline}
      className={`${className} outline-none rounded focus:ring-2 focus:ring-blue-400 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:italic`.trim()}
      onInput={(e: FormEvent<HTMLElement>) =>
        onChange(e.currentTarget.textContent ?? "")
      }
      onMouseDown={(e: MouseEvent<HTMLElement>) => e.stopPropagation()}
      onClick={(e: MouseEvent<HTMLElement>) => e.stopPropagation()}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        e.stopPropagation();
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.blur();
        }
      }}
      onBlur={(e: FormEvent<HTMLElement>) =>
        onChange(e.currentTarget.textContent ?? "")
      }
    />
  );
}
