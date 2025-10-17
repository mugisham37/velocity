'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContactList, ContactForm } from '@/components/modules/crm';
import { Contact, ContactFormData } from '@/types/crm';

const ContactsPage: React.FC = () => {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNew = () => {
    setSelectedContact(null);
    setShowForm(true);
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setShowForm(true);
  };

  const handleView = (contact: Contact) => {
    router.push(`/crm/contacts/${contact.name}`);
  };

  const handleSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save contact
      console.log('Saving contact:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowForm(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedContact(null);
  };

  if (showForm) {
    return (
      <ContactForm
        contact={selectedContact || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ContactList
      onCreateNew={handleCreateNew}
      onView={handleView}
      onEdit={handleEdit}
    />
  );
};

export default ContactsPage;