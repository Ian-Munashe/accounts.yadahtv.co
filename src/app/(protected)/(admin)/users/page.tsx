"use client";

import { LuSearch } from "react-icons/lu";
import { useEffect, useState } from "react";
import { Button, cn, InputGroup, Spinner } from "@heroui/react";

import { useAxios } from "@/hooks";
import { useUsersStore } from "@/stores";
import { UserCard } from "@/components/cards";
import { NoData } from "@/components/no-data";
import { EditUserModal } from "@/components/modals";
import { Pagination } from "@/components/pagination";
import { BreadCrumb } from "@/components/bread-crumb";
import { PermissionsDrawer } from "@/components/drawers";

const roles: ISelectOption[] = [
  { label: "All", value: "all" },
  { label: "Superadmins", value: "superadmin" },
  { label: "Admins", value: "admin" },
  { label: "Users", value: "user" },
];

export default function Admin() {
  const { interceptor } = useAxios();
  const { data, isLoading, page, totalPages, fetchData, setPage, updateData, search, setSearch, setFilters } =
    useUsersStore();

  const [user, setUser] = useState<IUser | undefined>();
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [role, setRole] = useState<string>("all");
  const [permissionsDrawerOpen, setPermissionsDrawerOpen] = useState(false);

  const handleEdit = (user: IUser) => {
    setUser(user);
    setEditUserOpen(true);
  };

  useEffect(() => {
    if (role && role !== "all") setFilters([role]);
    else setFilters([]);
    fetchData(interceptor, "/admin/users");
  }, [interceptor, page, role]);

  return (
    <div className="space-y-8">
      <BreadCrumb title="User Management" description="View and manage all users in the PHD Ministries ecosystem.">
        <InputGroup variant="secondary" className="w-full sm:w-64">
          <InputGroup.Prefix>
            <LuSearch className="h-4 w-4" />
          </InputGroup.Prefix>
          <InputGroup.Input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value, interceptor, "/admin/users")}
          />
        </InputGroup>
      </BreadCrumb>
      <div className="flex flex-wrap gap-2">
        {roles.map(({ label, value }) => (
          <Button
            key={value}
            size="sm"
            variant="outline"
            onPress={() => setRole(value)}
            className={cn(
              "text-muted bg-surface hover:border-accent/50 px-4 py-1.5 text-xs font-medium transition-all",
              {
                "bg-accent text-accent-foreground border-accent": role === value,
              },
            )}
          >
            {label}
          </Button>
        ))}
      </div>
      {isLoading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
      {!isLoading && data.length === 0 && <NoData title="No uers found" description="There aren't any users found." />}
      {!isLoading && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((user: IUser) => (
            <UserCard key={user._id} user={user} onEdit={handleEdit} />
          ))}
        </div>
      )}
      <Pagination totalPages={totalPages} currentPage={page} onJump={setPage} onNext={setPage} onPrevious={setPage} />
      {editUserOpen && (
        <EditUserModal
          user={user}
          isOpen={editUserOpen}
          onUpdateSuccess={(user) => updateData(user._id, user)}
          onConfigurePermissions={() => setPermissionsDrawerOpen(true)}
          onOpenChange={(isOpen) => {
            setEditUserOpen(isOpen);
            if (!isOpen) setUser(undefined);
          }}
        />
      )}
      {user && (
        <PermissionsDrawer
          permissions={user.permissions}
          isOpen={permissionsDrawerOpen}
          onOpenChange={setPermissionsDrawerOpen}
          onSave={(permissions) => setUser((prev: any) => ({ ...prev, permissions }))}
        />
      )}
    </div>
  );
}
