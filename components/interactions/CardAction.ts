export type CardAction = {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void | Promise<void>;
};
