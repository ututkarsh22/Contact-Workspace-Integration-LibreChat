const Contact = require('~/models/Contact.model');

/**
 * Extract keywords from user message
 */
function extractKeywords(text) {
  // Remove common words, keep meaningful ones
  const stopWords = new Set([
    'who','what','where','when','why','how','is','are','was','were',
    'the','a','an','in','at','for','me','our','all','about','tell','list',
    'show','find','do','did','does','we','you','they','i','know','works','work',
    'person','people','contact','contacts','employee','employees'
  ]);

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);

  const keywords = [];
  const seen = new Set();
  for (const token of tokens) {
    if (token.length < 3) continue; // skip very short tokens
    if (/^\d+$/.test(token)) continue; // skip numeric-only tokens
    if (stopWords.has(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    keywords.push(token);
  }

  return keywords;
}




async function searchRelevantContacts(text) {

  const keywords = extractKeywords(text);
  if (keywords.length === 0) return [];

  // Escape regex characters to avoid injection and unexpected patterns
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match all keywords somewhere (AND), but allow each keyword to match any of the fields (OR)
  const searchConditions = keywords.map(keyword => {
    const safe = escapeRegex(keyword);
    return {
      $or: [
        { name:    { $regex: safe, $options: 'i' } },
        { company: { $regex: safe, $options: 'i' } },
        { role:    { $regex: safe, $options: 'i' } },
        { email:   { $regex: safe, $options: 'i' } },
        { notes:   { $regex: safe, $options: 'i' } },
        { metadataText: { $regex: safe, $options: 'i' } }
      ]
    };
  });

  const query = { $or: searchConditions };

  const contacts = await Contact.find(query)
    .limit(40)
    .lean();

  return contacts;
}

function formatContactsForPrompt(contacts) {
  if (!contacts.length) return '';
  const formatted = contacts.map(c => {
    const parts = [];
    if (c.name) parts.push(`Name: ${c.name}`);
    if (c.company) parts.push(`Company: ${c.company}`);
    if (c.role) parts.push(`Role: ${c.role}`);
    if (c.email) parts.push(`Email: ${c.email}`);
    if (c.notes) parts.push(`Notes: ${c.notes}`);
    if (c.metadataText) parts.push(`External Data: ${c.metadataText}`);
    return parts.join(' | ');
  }).join('\n\n');

  return `You are answering questions using ONLY the provided contacts data. Do not invent or hallucinate details not present below. If unsure, say you don't know.\n\nRelevant Contacts:\n\n${formatted}\n\nEnd of contacts.`;
}

module.exports = { searchRelevantContacts, formatContactsForPrompt };