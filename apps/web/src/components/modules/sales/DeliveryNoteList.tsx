'use client';

import React from 'react';
import { DeliveryNote } from '@/types/sales';
import { useDocumentList } from '@/hooks/useDocuments';

interface DeliveryNoteListProps {
  onEdit?: (note: DeliveryNote) => void;
  onView?: (note: DeliveryNote) => void;
}

export default function DeliveryNoteList({ onEdit, onView }: DeliveryNoteListProps) {
  const { data: notes, isLoading } = useDocumentList('Delivery Note');

  if (isLoading) {
    return <div>Loading delivery notes...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Delivery Notes</h2>
      <div className="grid gap-4">
        {notes.map((note) => (
          <div key={note.name} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{note.name}</h3>
                <p className="text-sm text-gray-600">Customer: {(note as any).customer_name}</p>
                <p className="text-sm text-gray-600">Date: {(note as any).posting_date}</p>
              </div>
              <div className="flex space-x-2">
                {onView && (
                  <button
                    onClick={() => onView(note as DeliveryNote)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(note as DeliveryNote)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}