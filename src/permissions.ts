interface Categories {
  category: string;
  permissions: ISelectOption[];
}

export const permissions: Categories[] = [
  {
    category: "User Account",
    permissions: [
      { label: "Access Account", value: "login" },
      { label: "Users Management", value: "users" },
    ],
  },
  {
    category: "Yadah Basket",
    permissions: [
      { label: "View Payments", value: "yb:payments-read" },
      { label: "Update Payments", value: "yb:payments-write" },
    ],
  },
];
