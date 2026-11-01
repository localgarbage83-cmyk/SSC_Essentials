import Link from 'next/link';
export const metadata = { title: 'Not found' };
export default function NotFound() { return <main><h1>Page not found</h1><p className="sub">This page does not exist or is not published.</p><div className="btns"><Link className="btn" href="/">Back to home</Link></div></main>; }
