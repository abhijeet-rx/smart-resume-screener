import * as React from 'react';
import { PanelLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '4rem';

const SidebarContext = React.createContext(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

export const SidebarProvider = React.forwardRef(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const [openMobile, setOpenMobile] = React.useState(false);
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;

    const setOpen = React.useCallback(
      (value) => {
        const openState = typeof value === 'function' ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open]
    );

    const toggleSidebar = React.useCallback(() => {
      return window.innerWidth < 768
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [setOpen]);

    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile: false,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          style={{
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          }}
          className={cn(
            'flex min-h-screen w-full bg-[#0e091b] text-slate-100 font-inter selection:bg-[#7b39fc] selection:text-white',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

export const Sidebar = React.forwardRef(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'icon',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { open, openMobile, setOpenMobile } = useSidebar();

    return (
      <>
        {/* Mobile Backdrop Overlay */}
        {openMobile && (
          <div
            className="fixed inset-0 z-40 bg-[#0e091b]/80 backdrop-blur-md md:hidden"
            onClick={() => setOpenMobile(false)}
          />
        )}

        {/* Mobile Drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-full w-[var(--sidebar-width-mobile,18rem)] flex-col bg-[#18112b] border-r border-[rgba(164,132,215,0.2)] p-4 shadow-2xl transition-transform duration-300 md:hidden',
            openMobile ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(164,132,215,0.15)]">
            <span className="text-xs font-manrope font-semibold text-white/50">Navigation</span>
            <button
              onClick={() => setOpenMobile(false)}
              className="p-1 text-white/50 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>

        {/* Desktop Sidebar */}
        <aside
          ref={ref}
          className={cn(
            'hidden md:flex flex-col h-screen sticky top-0 z-30 shrink-0 bg-[#18112b]/95 backdrop-blur-xl border-r border-[rgba(164,132,215,0.2)] transition-all duration-300 select-none',
            open ? 'w-[16rem]' : 'w-[4.5rem]',
            className
          )}
          {...props}
        >
          {children}
        </aside>
      </>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export const SidebarTrigger = React.forwardRef(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar, open } = useSidebar();
    return (
      <button
        ref={ref}
        onClick={(e) => {
          onClick?.(e);
          toggleSidebar();
        }}
        className={cn(
          'p-2 rounded-lg text-white/70 hover:text-white hover:bg-[#2b2344]/50 border border-[rgba(164,132,215,0.2)] transition-colors cursor-pointer',
          className
        )}
        title={open ? 'Collapse Sidebar' : 'Expand Sidebar'}
        {...props}
      >
        <PanelLeft className="w-5 h-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </button>
    );
  }
);
SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col p-4 border-b border-[rgba(164,132,215,0.15)]', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar', className)}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-1.5', className)} {...props} />
));
SidebarGroup.displayName = 'SidebarGroup';

export const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        'px-3 text-[11px] font-manrope font-semibold uppercase tracking-wider text-white/40',
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-1', className)} {...props} />
));
SidebarGroupContent.displayName = 'SidebarGroupContent';

export const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn('space-y-1', className)} {...props} />
));
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('list-none', className)} {...props} />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef(
  ({ className, isActive, children, ...props }, ref) => {
    const { open } = useSidebar();
    return (
      <button
        ref={ref}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-manrope font-semibold transition-all cursor-pointer',
          isActive
            ? 'bg-[#7b39fc] text-white shadow-[0_4px_14px_rgba(123,57,252,0.4)]'
            : 'text-white/60 hover:text-white hover:bg-white/5',
          !open && 'justify-center px-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-3 border-t border-[rgba(164,132,215,0.15)] space-y-2 mt-auto', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';
