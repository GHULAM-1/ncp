import { Button } from "@/components/ui/button";

export function SocialButton({
  icon,
  provider,
  onClick,
}: {
  icon: React.ReactNode;
  provider: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="w-full h-12 flex items-center justify-start space-x-3  text-base border-gray-300 hover:bg-gray-50 text-gray-700"
      onClick={onClick}
    >
      {icon}
      <span>Continue with {provider}</span>
    </Button>
  );
}
