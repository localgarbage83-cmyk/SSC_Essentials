const P = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
export const PdfIcon = ({ size = 22 }) => <svg {...P} width={size} height={size}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 14h2.2a1.3 1.3 0 0 0 0-2.6H9V17" /></svg>;
export const DownloadIcon = ({ size = 16 }) => <svg {...P} width={size} height={size}><path d="M12 4v11m-4-4 4 4 4-4M5 20h14" /></svg>;
export const Chevron = () => <svg {...P} width="18" height="18" className="chev"><path d="m9 18 6-6-6-6" /></svg>;
