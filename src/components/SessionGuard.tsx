interface SessionGuardProps {
  children: React.ReactNode;
}

// TODO: Implement proper authentication once login page is ready
export default function SessionGuard({ children }: SessionGuardProps) {
  return <>{children}</>;
}
