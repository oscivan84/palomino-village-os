export default function TestPage() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Palomino Village OS - Test Page</h1>
      <p>If you see this, the basic Next.js framework works.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
