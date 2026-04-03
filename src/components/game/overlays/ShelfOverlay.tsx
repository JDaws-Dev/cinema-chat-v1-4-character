"use client";

import { ShelfBrowser } from "@/components/game/ShelfBrowser";
import { type EraId } from "@/lib/curated-movie-catalog";
import { type Dispatch, type SetStateAction } from "react";

export type ShelfBrowseState = { genre: string; shelfId?: string; count?: number; label?: string };

interface ShelfOverlayProps {
  shelfBrowse: ShelfBrowseState | null;
  era: string;
  closeOverlay: () => void;
  onFilmClick: (id: number) => void;
}

export function ShelfOverlay({ shelfBrowse, era, closeOverlay, onFilmClick }: ShelfOverlayProps) {
  return (
    <ShelfBrowser
      genre={shelfBrowse?.genre || ""}
      shelfId={shelfBrowse?.shelfId}
      shelfCount={shelfBrowse?.count}
      label={shelfBrowse?.label}
      eraId={era as EraId}
      open
      onClose={closeOverlay}
      onFilmClick={onFilmClick}
    />
  );
}
