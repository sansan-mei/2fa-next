"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AuthCode } from "./AuthCode";

interface SortableAuthCodeProps {
  id: string;
  name: string;
  issuer?: string;
  code: string;
  timeRemaining: number;
  onDelete?: () => void;
  onEdit?: (name: string, issuer: string) => void;
}

export function SortableAuthCode(props: SortableAuthCodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AuthCode {...props} />
    </div>
  );
}
