import { SignUpForm } from "./sign-up-form";
export default function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-[450px] flex-col gap-6">
        <SignUpForm />
      </div>
    </div>
  );
}
