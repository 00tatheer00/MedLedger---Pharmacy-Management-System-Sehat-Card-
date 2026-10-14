'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-text-muted mb-3 sm:mb-4">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-text-primary transition-colors focus-ring rounded"
          >
            <Home className="h-3.5 w-3.5 text-text-secondary" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
            {item.href && !item.current ? (
              <Link
                href={item.href}
                className="hover:text-text-primary transition-colors focus-ring rounded"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-semibold text-text-primary"
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
