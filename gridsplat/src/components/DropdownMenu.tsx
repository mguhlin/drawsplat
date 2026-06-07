import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';

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

  return (
    <div className="dropdown-menu">
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        className="menu-button"
        type="button"
        onBlur={(event) => {
          if (
            !event.currentTarget.parentElement?.contains(event.relatedTarget)
          ) {
            setIsOpen(false);
          }
        }}
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
          onBlur={(event) => {
            if (
              !event.currentTarget.parentElement?.contains(event.relatedTarget)
            ) {
              setIsOpen(false);
            }
          }}
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
