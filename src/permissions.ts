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
      { label: "View Payments", value: "yb:payments" },
      { label: "Update Payments", value: "yb:payments-write" },
      { label: "Guest House Bookings", value: "yb:gh-bookings" },
      { label: "Flight Management", value: "yb:gh-flights" },
      { label: "Delete Flight", value: "yb:gh-delete-flight" },
      { label: "Guest List Management", value: "yb:gh-guest-list" },
      { label: "Guest House Manager", value: "yb:gh-manager" },
      { label: "Guest House Access", value: "yb:gh-access" },
    ],
  },
];
