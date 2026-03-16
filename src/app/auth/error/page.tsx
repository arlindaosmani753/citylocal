export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Authentication Error</h1>
        <p className="text-muted-foreground mt-2">The link may have expired. Please try again.</p>
        <a href="/login" className="mt-4 inline-block text-sm underline">
          Back to login
        </a>
      </div>
    </div>
  )
}
