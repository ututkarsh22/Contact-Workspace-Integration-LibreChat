import { useState, useRef } from 'react';
import { useContacts } from '~/hooks/useContacts';
import { cn } from '~/utils';



export default function ContactsPanel() {
  const { contacts, loading, importCSV, addContact, updateContact, deleteContact, fetchContacts } = useContacts();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: '', company: '', role: '', email: '', notes: ''
  });

  const [extraFields, setExtraFields] = useState([{ key: '', value: '' }]);
  const addExtraField = () => {
    setExtraFields([...extraFields, { key: '', value: '' }]);
  };

  const updateExtraField = (index, type, value) => {
    const updated = [...extraFields];
    updated[index][type] = value;
    setExtraFields(updated);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const result = await importCSV(file);
    setImporting(false);
    alert(result.message);
  };

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', company: '', role: '', email: '', notes: '' });
  const handleAdd = async () => {
    if (!form.name) return alert('Name is required');
    const metaData = {};

    extraFields.forEach(({ key, value }) => {
      if (key.trim()) metaData[key.trim()] = value.trim();
    });

    await addContact({ ...form, metaData });
    setForm({ name: '', company: '', role: '', email: '', notes: '' });
    setExtraFields([{ key: '', value: '' }]);
    setShowAdd(false);
  };

  return (
    <>
      {/* Nav Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex gap-2 rounded p-2.5 text-sm cursor-pointer items-center transition-colors duration-200 text-text-primary hover:bg-surface-active-alt"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Contacts
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-80 bg-surface-primary border-l border-border-medium z-50 flex flex-col shadow-xl">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-medium">
            <h2 className="text-base font-semibold text-text-primary">Contacts ({contacts.length})</h2>
            <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 p-3 border-b border-border-medium">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex-1 text-xs bg-surface-active-alt hover:bg-surface-hover rounded p-2 text-text-primary"
            >
              + Add Contact
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 text-xs bg-surface-active-alt hover:bg-surface-hover rounded p-2 text-text-primary"
            >
              {importing ? 'Importing...' : '↑ Import CSV'}
            </button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </div>

          {/* Add Form */}
          {showAdd && (
            <div className="p-3 border-b border-border-medium flex flex-col gap-2">
              {['name', 'company', 'role', 'email', 'notes'].map((field) => (
                <input
                  key={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full text-xs rounded p-2 bg-surface-secondary border border-border-medium text-text-primary"
                />
              ))}
              <p className="text-xs text-text-secondary mt-1">Extra Fields (optional)</p>
              {extraFields.map((field, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    placeholder="Key (e.g. Industry)"
                    value={field.key}
                    onChange={(e) => updateExtraField(index, 'key', e.target.value)}
                    className="w-1/2 text-xs rounded p-2 bg-surface-secondary border border-border-medium text-text-primary"
                  />
                  <input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => updateExtraField(index, 'value', e.target.value)}
                    className="w-1/2 text-xs rounded p-2 bg-surface-secondary border border-border-medium text-text-primary"
                  />
                </div>
              ))}
              <button
                onClick={addExtraField}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                + Add another field
              </button>
              <button
                onClick={handleAdd}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded p-2"
              >
                Save Contact
              </button>
            </div>
          )}

          {selected && (
            <div className="p-4 border-b border-border-medium bg-surface-secondary">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-text-primary">{selected?.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setEditForm({
                        id: selected._id,
                        name: selected.name || '',
                        company: selected.company || '',
                        role: selected.role || '',
                        email: selected.email || '',
                        notes: selected.notes || ''
                      });
                    }}
                    title="Edit"
                    className="text-text-secondary hover:text-text-primary"
                  >
                    ✎
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this contact?')) return;
                      try {
                        await deleteContact(selected._id);
                        setSelected(null);
                      } catch (err) {
                        alert('Delete failed');
                      }
                    }}
                    title="Delete"
                    className="text-text-secondary hover:text-red-600"
                  >
                    🗑
                  </button>
                  <button onClick={() => setSelected(null)} className="text-xs text-text-secondary">✕</button>
                </div>
              </div>
              <p className="text-xs text-text-secondary">{selected.role} @ {selected.company}</p>
              <p className="text-xs text-text-secondary">{selected.email}</p>
              {selected.notes && <p className="text-xs text-text-secondary mt-1">{selected.notes}</p>}
              {selected.metaData && Object.keys(selected.metaData).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-text-primary mb-1">Details</p>
                  {Object.entries(selected.metaData).map(([k, v]) => (
                    <p key={k} className="text-xs text-text-secondary">
                      <span className="capitalize">{k}</span>: {v}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {editMode && (
            <div className="p-3 border-b border-border-medium flex flex-col gap-2 bg-surface-secondary">
              <h3 className="text-sm font-medium">Edit Contact</h3>
              {['name', 'company', 'role', 'email', 'notes'].map((field) => (
                <input
                  key={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={editForm[field]}
                  onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  className="w-full text-xs rounded p-2 bg-surface-secondary border border-border-medium text-text-primary"
                />
              ))}
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const { id, ...payload } = editForm;
                      await updateContact(id, payload);
                      await fetchContacts();
                      setEditMode(false);
                      setSelected(null);
                    } catch (err) {
                      alert('Update failed');
                    }
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded p-2"
                >
                  Save
                </button>
                <button onClick={() => setEditMode(false)} className="text-xs bg-surface-active-alt hover:bg-surface-hover rounded p-2">Cancel</button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="text-xs text-text-secondary p-4">Loading...</p>}
            {!loading && contacts.length === 0 && (
              <p className="text-xs text-text-secondary p-4">No contacts yet.</p>
            )}
            {contacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => setSelected(contact)}
                className={cn(
                  'p-3 border-b border-border-medium cursor-pointer hover:bg-surface-active-alt transition-colors',
                  selected?._id === contact._id && 'bg-surface-active-alt'
                )}
              >
                <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                <p className="text-xs text-text-secondary">{contact.role} @ {contact.company}</p>
              </div>
            ))}
          </div>

        </div>
      )}
    </>
  );
}