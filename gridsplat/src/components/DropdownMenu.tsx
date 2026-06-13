import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export interface DropdownMenuItem {
  label: string;
  onSelect: () => void;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  label: string;
}

export function DropdownMenu({ items, label }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener('pointerdown', closeOnOutsidePointer);

    return () =>
      window.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isOpen]);

  return (
    <div className="dropdown-menu" ref={menuRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        className="menu-button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{label}</span>
        <ChevronDown aria-hidden="true" size={18} />
      </button>
      {isOpen ? (
        <div
          aria-label={`${label} menu`}
          className="menu-popover"
          id={menuId}
          role="menu"
        >
          {items.map((item) => (
            <button
              className="menu-item"
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                item.onSelect();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
