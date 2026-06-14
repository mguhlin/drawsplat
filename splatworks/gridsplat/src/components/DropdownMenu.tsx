import { ChevronDown, ChevronRight } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

export interface DropdownMenuItem {
  children?: DropdownMenuItem[];
  icon?: ReactNode;
  label: string;
  onSelect?: () => void;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  label: string;
}

export function DropdownMenu({ items, label }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setOpenSubmenu(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setOpenSubmenu(null);
      }
    }

    window.addEventListener('pointerdown', closeOnOutsidePointer);
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('pointerdown', closeOnOutsidePointer);
      window.removeEventListener('keydown', closeOnEscape);
    };
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
            <div className="menu-row" key={item.label}>
              <button
                aria-expanded={
                  item.children ? openSubmenu === item.label : undefined
                }
                className="menu-item"
                role="menuitem"
                type="button"
                onClick={() => {
                  if (item.children) {
                    setOpenSubmenu((current) =>
                      current === item.label ? null : item.label,
                    );
                    return;
                  }

                  item.onSelect?.();
                  setIsOpen(false);
                  setOpenSubmenu(null);
                }}
              >
                {item.icon ? (
                  <span className="menu-item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.label}</span>
                {item.children ? (
                  <ChevronRight aria-hidden="true" size={18} />
                ) : null}
              </button>
              {item.children && openSubmenu === item.label ? (
                <div
                  aria-label={`${item.label} submenu`}
                  className="submenu-popover"
                  role="menu"
                >
                  {item.children.map((child) => (
                    <button
                      className="menu-item submenu-item"
                      key={child.label}
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        child.onSelect?.();
                        setIsOpen(false);
                        setOpenSubmenu(null);
                      }}
                    >
                      {child.icon ? (
                        <span className="menu-item-icon" aria-hidden="true">
                          {child.icon}
                        </span>
                      ) : null}
                      <span>{child.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
