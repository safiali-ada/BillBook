import React from 'react';
import { Menu, Droplets } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="md:hidden sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-slate-800 bg-slate-950 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-3 w-full">
          <Droplets className="w-6 h-6 text-primary-400" />
          <div className="flex flex-1 text-lg font-bold tracking-wide text-white">
            BillBook
          </div>
          <button type="button" className="-m-2.5 p-2.5 text-slate-300" onClick={onMenuClick}>
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}