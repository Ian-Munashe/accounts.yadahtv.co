interface IApplication {
  _id: string;
  token: string;
  clientId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  type: "web" | "mobile" | "api" | "desktop";
}
