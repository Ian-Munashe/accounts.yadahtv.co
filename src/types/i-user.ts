export {};

declare global {
  interface IUserMetadata {
    contacts?: string[];
    notifications?: Record<string, boolean>;
    codename?: string;
    phone?: string;
  }

  interface IUser {
    _id: string;
    avatar?: string;
    country: string;
    fullname: string;
    createdAt: string;
    updatedAt: string;
    identifier: string;
    permissions: string[];
    metadata?: IUserMetadata;
    gender: "male" | "female";
    status: "active" | "suspended";
    role: "superadmin" | "admin" | "user";
  }
}
