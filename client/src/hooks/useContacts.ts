import { useState, useEffect } from 'react';

export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contacts/');
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const importCSV = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/contacts/import', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    await fetchContacts();
    return data;
  };

  const addContact = async (contact) => {

    console.log("COntact ",contact);
    const res = await fetch('/api/contacts/addContact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    const data = await res.json();
    await fetchContacts();
    return data;
  };

  const updateContact = async (id, contact) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      const data = await res.json();
      await fetchContacts();
      return data;
    } catch (err) {
      console.error('Failed to update contact:', err);
      throw err;
    }
  };

  const deleteContact = async (id) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      await fetchContacts();
      return data;
    } catch (err) {
      console.error('Failed to delete contact:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return { contacts, loading, fetchContacts, importCSV, addContact, updateContact, deleteContact };
}