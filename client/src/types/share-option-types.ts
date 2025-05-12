export interface ShareOptionProps {
  id: string;
  label: string;
  onClick: () => void;
  iconType: "copy" | "facebook" | "whatsapp" | "viber";
}
export interface ShareModalProps {
  url: string;
  title: string;
  onClose: () => void;
}
