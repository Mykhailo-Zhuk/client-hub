'use client';

import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = {
  value: string;
  onChange: (v: string) => void;
};

import { createContext, useContext } from 'react';

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be inside <Tabs>');
  return ctx;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: ReactNode;
}) {
  const [internal, setInternal] = useState(value ?? defaultValue);
  const current = value ?? internal;
  const setCurrent = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, onChange: setCurrent }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-9 items-center justify-start gap-1 rounded-lg border border-border bg-muted/40 p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useTabs();
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.onChange(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all',
        active
          ? 'bg-background text-foreground shadow'
          : 'hover:text-foreground/80',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useTabs();
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={cn('mt-4 focus:outline-none', className)}>
      {children}
    </div>
  );
}
