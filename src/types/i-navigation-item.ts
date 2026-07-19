interface INavigationItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  roles?: ("superadmin" | "admin" | "editor" | "user")[];
}
