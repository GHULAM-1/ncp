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
      className="w-full h-12 flex items-center justify-center space-x-3 text-base font-medium border-2 border-gray-200 dark:border-gray-600 hover:border-[#33a47d] dark:hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      {icon}
      <span>Continue with {provider}</span>
    </Button>
  );
}
