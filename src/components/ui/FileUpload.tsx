import { useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  children: ReactNode;
  className?: string;
}

export function FileUpload({
  accept = 'image/*',
  multiple = false,
  onChange,
  children,
  className = '',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={className}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      {children}
    </button>
  );
}
