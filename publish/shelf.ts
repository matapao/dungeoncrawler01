/** Replace only this game's shelf record, retaining all previously published games. */
export function updateAlphaShelf(html: string, entry: unknown, version: string): string {
  const pattern = /(<script\s+type="application\/json"\s+id="media">)([\s\S]*?)(<\/script>)/g;
  const matches = [...html.matchAll(pattern)];
  const match = matches[0];
  if (matches.length !== 1 || !match || typeof match[2] !== 'string')
    throw new Error('Live site media boundary changed.');
  const existing: unknown = JSON.parse(match[2]);
  if (!existing || typeof existing !== 'object' || Array.isArray(existing))
    throw new Error('Invalid live media.');
  const id = 'dungeoncrawler01';
  if (Object.hasOwn(existing, id)) {
    const previous: unknown = Reflect.get(existing, id);
    if (!previous || typeof previous !== 'object' || Array.isArray(previous))
      throw new Error('Invalid existing game shelf record.');
    const launch: unknown = Reflect.get(previous, 'solo');
    if (typeof launch !== 'string' || !/^\/dungeoncrawler01\/@\d+\.\d+\.\d+\/$/.test(launch))
      throw new Error('Existing shelf entry does not identify an immutable game version.');
    if (launch === `/${id}/@${version}/`) throw new Error('This version is already the shelf launch.');
  }
  const media = JSON.stringify({ ...existing, [id]: entry }).replace(/</g, '\\u003c');
  return html.replace(
    pattern,
    (_whole, open: string, _body: string, close: string) => `${open}\n${media}\n${close}`,
  );
}
