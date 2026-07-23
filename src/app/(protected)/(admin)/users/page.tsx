"use client";

import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { useQueryClient } from "@tanstack/react-query";
import { Button, cn, InputGroup, Spinner } from "@heroui/react";

import { useUsersListState } from "@/stores";
import { UserCard } from "@/components/cards";
import { NoData } from "@/components/no-data";
import { EditUserModal } from "@/components/modals";
import { Pagination } from "@/components/pagination";
import { useAxios, usePaginatedQuery } from "@/hooks";
import { BreadCrumb } from "@/components/bread-crumb";
import { PermissionsDrawer } from "@/components/drawers";

const roles: ISelectOption[] = [
  { label: "All", value: "all" },
  { label: "Superadmins", value: "superadmin" },
  { label: "Admins", value: "admin" },
  { label: "Users", value: "user" },
];

export default function Admin() {
  const queryClient = useQueryClient();
  const { interceptor } = useAxios();
  const { page, setPage, search, setSearch } = useUsersListState();

  const [selectedUser, setSelectedUser] = useState<IUser | undefined>();
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [role, setRole] = useState<string>("all");
  const [permissionsDrawerOpen, setPermissionsDrawerOpen] = useState(false);

  const handleEdit = (user: IUser) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const handleUserUpdateSuccess = (updatedUser: IUser) => {
    queryClient.setQueriesData({ queryKey: ["users"] }, (oldData: any) => {
      if (!oldData) return oldData;
      if (Array.isArray(oldData)) return oldData.map((u) => (u._id === updatedUser._id ? updatedUser : u));
      return {
        ...oldData,
        results: oldData.results?.map((u: IUser) => (u._id === updatedUser._id ? updatedUser : u)),
      };
    });
    setSelectedUser(updatedUser);
  };

  const { data, isFetching } = usePaginatedQuery<IUser>("users", "/admin/users", {
    page,
    search,
    filters: role !== "all" ? [role] : [],
  });

  const users = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;

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
            onPress={() => handleRoleChange(value)}
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
      {isFetching && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
      {!isFetching && users.length === 0 && (
        <NoData title="No users found" description="There are not any users found." />
      )}
      {users.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user: IUser) => (
            <UserCard key={user._id} user={user} onEdit={handleEdit} />
          ))}
        </div>
      )}
      {totalPages > 0 && (
        <Pagination totalPages={totalPages} currentPage={page} onJump={setPage} onNext={setPage} onPrevious={setPage} />
      )}
      {editUserOpen && (
        <EditUserModal
          user={selectedUser}
          isOpen={editUserOpen}
          onUpdateSuccess={handleUserUpdateSuccess}
          onConfigurePermissions={() => setPermissionsDrawerOpen(true)}
          onOpenChange={(isOpen) => {
            setEditUserOpen(isOpen);
            if (!isOpen) setSelectedUser(undefined);
          }}
        />
      )}
      {selectedUser && (
        <PermissionsDrawer
          permissions={selectedUser.permissions}
          isOpen={permissionsDrawerOpen}
          onOpenChange={setPermissionsDrawerOpen}
          onSave={(permissions) => setSelectedUser((prev: any) => ({ ...prev, permissions }))}
        />
      )}
    </div>
  );
}
