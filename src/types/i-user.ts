interface IUser {
  _id: string;
  avatar?: any;
  country: string;
  fullname: string;
  createdAt: string;
  updatedAt: string;
  identifier: string;
  permissions: string[];
  metadata?: Record<string, any>;
  gender: "male" | "female";
  status: "active" | "suspended";
  role: "superadmin" | "admin" | "user";
}
