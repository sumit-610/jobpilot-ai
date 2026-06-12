import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">JobPilot AI</h1>
        <p className="text-zinc-400 text-sm">Your autonomous job hunting agent</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "bg-zinc-900 border border-zinc-800 shadow-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            formButtonPrimary:
              "bg-orange-500 hover:bg-orange-600 text-white transition-colors",
            formFieldInput:
              "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500",
            formFieldLabel: "text-zinc-300",
            footerActionLink: "text-orange-400 hover:text-orange-300",
            identityPreviewText: "text-zinc-300",
            identityPreviewEditButton: "text-orange-400",
          },
        }}
      />
    </main>
  );
}
