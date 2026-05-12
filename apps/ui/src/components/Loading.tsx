export function Loading({ message }: Readonly<{ message: string }>) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>{message}</p>
      </div>
    );
}